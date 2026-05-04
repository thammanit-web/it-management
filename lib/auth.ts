import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { authConfig } from "./auth.config";
import prisma from "@/lib/prisma";
import { logAudit } from "./audit";
import { headers } from "next/headers";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider !== "microsoft-entra-id") return false;

      const azureId = (profile?.sub || profile?.oid) as string;
      const email = (profile?.email || profile?.preferred_username || user.email) as string;
      const name = (profile?.name || user.name) as string;

      if (!azureId || !email) return false;

      // Find existing user by azureId first, then by email
      let dbUser = await prisma.user.findFirst({
        where: { OR: [{ azureId }, { email }] },
        include: { employee: true },
      });

      if (dbUser) {
        // Link azureId and email if not yet set
        if (!dbUser.azureId || !dbUser.email) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              azureId: dbUser.azureId ?? azureId,
              email: dbUser.email ?? email,
            },
          });
        }
      } else {
        // First-time MS365 login — fetch full profile from MS Graph
        let graphProfile: {
          displayName?: string;
          givenName?: string;
          surname?: string;
          department?: string;
          jobTitle?: string;
          employeeId?: string;
        } = {};

        if (account?.access_token) {
          try {
            const res = await fetch("https://graph.microsoft.com/v1.0/me?$select=displayName,givenName,surname,department,jobTitle,employeeId", {
              headers: { Authorization: `Bearer ${account.access_token}` },
            });
            if (res.ok) graphProfile = await res.json();
          } catch {
            // Graph call failed — continue without extra profile data
          }
        }

        const displayName = graphProfile.displayName || name;
        const firstName = graphProfile.givenName || "";
        const lastName = graphProfile.surname || "";
        const department = graphProfile.department || null;
        const position = graphProfile.jobTitle || null;

        // Try to match existing Employee: employee_code first, then UserCredential email.
        // If the matched employee is linked to an old credentials-based user (no azureId),
        // detach it from that old user so the MS365 user can claim it.
        let matchedEmployeeId: string | null = null;
        let employeeCodeExists = false;

        const tryClaimEmployee = async (employeeId: string): Promise<boolean> => {
          const linkedUser = await prisma.user.findFirst({
            where: { employeeId },
            select: { id: true, azureId: true },
          });
          if (!linkedUser) {
            // Not linked to anyone — free to connect
            matchedEmployeeId = employeeId;
            return true;
          }
          if (!linkedUser.azureId) {
            // Old credentials-based user — detach and re-link to this MS365 user
            await prisma.user.update({
              where: { id: linkedUser.id },
              data: { employeeId: null },
            });
            matchedEmployeeId = employeeId;
            return true;
          }
          // Already claimed by another MS365 user — don't steal it
          return false;
        };

        // 1. Match by employee_code (MS Graph employeeId field)
        if (graphProfile.employeeId) {
          const byCode = await prisma.employee.findUnique({
            where: { employee_code: graphProfile.employeeId },
            select: { id: true },
          });
          if (byCode) {
            employeeCodeExists = true;
            await tryClaimEmployee(byCode.id);
          }
        }

        // 2. Match by email via UserCredential if no employee_code match
        if (!matchedEmployeeId) {
          const credential = await prisma.userCredential.findFirst({
            where: { email_address: { equals: email, mode: "insensitive" } },
            select: { employeeId: true },
          });
          if (credential) await tryClaimEmployee(credential.employeeId);
        }

        // Safe fallback code: only use Graph employeeId if it doesn't already exist in DB
        const safeEmployeeCode = employeeCodeExists
          ? `MS-${azureId.slice(0, 8).toUpperCase()}`
          : (graphProfile.employeeId || `MS-${azureId.slice(0, 8).toUpperCase()}`);

        // Build employee create/connect data
        const employeeData = matchedEmployeeId
          ? { employee: { connect: { id: matchedEmployeeId } } }
          : {
              employee: {
                create: {
                  employee_code: safeEmployeeCode,
                  employee_name_th: displayName,
                  employee_name_en: firstName && lastName ? `${firstName} ${lastName}` : displayName,
                  department,
                  position,
                  status: "ACTIVE",
                },
              },
            };

        dbUser = await prisma.user.create({
          data: { azureId, email, role: "user", ...employeeData },
          include: { employee: true },
        });
      }

      // Attach DB fields to user object so JWT callback can pick them up
      user.id = dbUser.id;
      user.role = dbUser.role;
      user.employeeId = dbUser.employeeId;
      user.name = dbUser.employee?.employee_name_en || name;

      return true;
    },
  },
  events: {
    async signIn({ user }) {
      const headList = await headers();
      const ip = headList.get("x-forwarded-for") || "unknown";
      const ua = headList.get("user-agent") || "unknown";

      await logAudit({
        userId: user.id,
        userName: user.name || "Unknown",
        action: "LOGIN_SUCCESS",
        module: "AUTH",
        details: { email: user.email },
        ipAddress: ip,
        userAgent: ua,
      });
    },
  },
});
