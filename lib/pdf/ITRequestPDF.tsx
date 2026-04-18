import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font
} from "@react-pdf/renderer";

// Register Bai Jamjuree local fonts
Font.register({
  family: 'Bai Jamjuree',
  fonts: [
    { src: '/fonts/BaiJamjuree-Regular.ttf' }, // regular
    { src: '/fonts/BaiJamjuree-Medium.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Bai Jamjuree',
    fontSize: 11,
    color: '#000',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logo: {
    width: 60,
    height: 40,
    objectFit: 'contain'
  },
  brandText: {
    marginLeft: 5
  },
  brandMain: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F1059'
  },
  brandSub: {
    fontSize: 10,
    color: '#0F1059',
    letterSpacing: 2
  },
  titleContainer: {
    flex:1,
    border: '1pt',
    padding: '8pt 20pt',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 10,
    marginTop: 5
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5
  },
  infoItem: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 8
  },
  label: {
    fontWeight: 'bold'
  },
  valueWrapper: {
    flex: 1,
    borderBottom: '1pt dotted #000',
    marginLeft: 5,
    minHeight: 14
  },
  value: {
    fontSize: 12
  },
  gridBox: {
    border: '1pt solid #000',
    flexDirection: 'row',
    minHeight: 100
  },
  gridSide: {
    width: '15%',
    borderRight: '1pt solid #000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 5
  },
  gridContent: {
    width: '85%',
    flexDirection: 'row',
    padding: 15
  },
  checkBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  square: {
    width: 12,
    height: 12,
    border: '1pt solid #000',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  squareChecked: {
    backgroundColor: '#333'
  },
  checkedDot: {
    width: 4,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2
  },
  detailsBox: {
    marginTop: 15,
    border: '1pt solid #000',
    padding: 20,
    minHeight: 150
  },
  boxTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 15,
    fontSize: 10
  },
  dottedLine: {
    borderBottom: '1pt dotted #000',
    width: '100%',
    height: 25
  },
  approvalSection: {
    marginTop: 10,
    flexDirection: 'column',
    gap: 5,
  },
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  approvalLeft: {
    width: '45%',
  },
  approvalRight: {
    width: '30%',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 8,
  },
  commentLabel: {
    fontSize: 10,
    marginTop: 3,
  },
  dottedLineContainer: {
    marginTop: 3,
    fontSize: 10,
  },
  signatureTable: {
    border: '1pt solid #000',
    width: '100%',
  },
  sigTableHeader: {
    borderBottom: '1pt solid #000',
    padding: 3,
    textAlign: 'center',
  },
  sigTableContent: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sigTableFooter: {
    borderTop: '1pt solid #000',
    padding: 3,
  },
  checkboxGroup: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  approvalBlock: {
    flex: 1
  },
  signatureBox: {
    borderWidth: 1,
    flex: 1,
    height: 60,
    flexDirection: 'column',
  },
  sigHeader: {
    backgroundColor: '#f9fafb',
    borderBottom: '1pt',
    textAlign: 'center',
    padding: 3,
    fontSize: 9,
    fontWeight: 'bold'
  },
  sigContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sigText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0000FF'
  },
  sigFooter: {
    borderTop: '1pt solid #000',
    padding: 2,
    fontSize: 9,
    fontWeight: 'bold'
  },
  footer: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 10,
    color: '#999'
  }
});

interface ITRequestPDFProps {
  data: any;
  locale?: 'en' | 'th';
}

export const ITRequestPDF: React.FC<ITRequestPDFProps> = ({ data, locale = 'th' }) => {
  if (!data) return null;

  const formatDate = (date: any) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isEquipment = !!data.equipmentList;
  const isType = (type: string) => data.type_request === type || (isEquipment && type === "BORROW_ACC");
  
  const getTypeName = (type: string) => {
    if (locale !== 'th') return type;
    const map: Record<string, string> = {
      SUPPORT: "บริการสนับสนุน/Guide",
      PASSWORD_ACCOUNT: "แก้รหัสผ่าน/บัญชี",
      REPAIR: "แจ้งซ่อม",
      ACCESS: "ขอสิทธิ์ระบบ",
      PURCHASE: "จัดซื้ออุปกรณ์",
      BORROW_ACC: "ยืมอุปกรณ์",
      CHANGE:"การเปลี่ยนแปลงระบบ",
      LICENSE:"การขอใช้งาน License",
      INSTALLATION:"ติดตั้ง / เซ็ตอัพ"
    };
    return map[type] || type;
  };

  const isOther = !["REPAIR", "ACCESS", "BORROW_ACC", "PURCHASE"].includes(data.type_request) && !isEquipment;
  const eqCode = data.equipment_code || data.request_code || "";

  const labels = {
    title: isEquipment 
      ? (locale === 'th' ? "แบบฟอร์มเบิกอุปกรณ์ (Borrow Equipment)" : "Borrow Equipment Requisition Form")
      : (locale === 'th' ? "แบบฟอร์มร้องขอด้าน IT (IT Request)" : "IT Support Request Form"),
    requesterInfo: locale === 'th' ? "ข้อมูลผู้ร้องขอ (Requester Information)" : "Requester Information",
    date: locale === 'th' ? "วันที่ร้องขอ (Date) :" : "Date :",
    no: locale === 'th' ? "เลขที่ / No :" : "No :",
    empCode: locale === 'th' ? "รหัสพนักงาน :" : "Employee Code :",
    name: locale === 'th' ? "ชื่อ-สกุล (Name) :" : "Full Name :",
    dept: locale === 'th' ? "แผนก (Dept) :" : "Department :",
    position: locale === 'th' ? "ตำแหน่ง (Position) :" : "Position :",
    details: locale === 'th' ? "รายละเอียดการร้องขอ" : "Request Details",
    purpose: locale === 'th' ? "เป้าหมายการเบิก" : "Purpose",
    repair: locale === 'th' ? "ขอซ่อมแซมแก้ไข/Request for repair" : "Request for repair",
    access: locale === 'th' ? "ขอสิทธิ์การใช้งานระบบ/Request a system access" : "Request a system access",
    borrow: locale === 'th' ? `ขอยืมอุปกรณ์/BorrowAsset ${isEquipment ? "(Equipment)" : "(Accessory)"}` : `Borrow Asset ${isEquipment ? "(Equipment)" : "(Accessory)"}`,
    purchase: locale === 'th' ? "ขอจัดซื้ออุปกรณ์ IT/Request for purchase" : "Request for purchase",
    other: locale === 'th' ? "อื่นๆ/Other" : "Other",
    normal: locale === 'th' ? "ปกติ/Normal" : "Normal",
    urgent: locale === 'th' ? "เร่งด่วน/Urgent" : "Urgent",
    desc: locale === 'th' ? "สิ่งที่ร้องขอ / รายการอุปกรณ์ (Description / Items)" : "Description / Items",
    reasonTitle: locale === 'th' ? "เหตุผลการร้องขอ (Request Reason / Business Justification)" : "Request Reason / Business Justification",
    noReason: locale === 'th' ? "ไม่ได้ระบุเหตุผล / No reason specified." : "No reason specified.",
    mgrApproval: locale === 'th' ? "ผู้จัดการแผนกผู้ร้องขอพิจารณา (Department manager considers)" : "Department Manager Approval",
    comment: locale === 'th' ? "หมายเหตุเพิ่มเติม (More Comment)" : "Additional Comments",
    approve: locale === 'th' ? "อนุมัติ (Approve)" : "Approve",
    reject: locale === 'th' ? "ไม่อนุมัติ (Reject)" : "Reject",
    signature: locale === 'th' ? "ลงลายมือชื่อ / Signature" : "Signature",
    itApproval: locale === 'th' ? "หน่วยงาน IT (IT Signed by IT department)" : "IT Department Approval",
  };

  return (
    <Document title={`Req_${eqCode}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Image src="/logo/NDC-LOGO-04.png" style={styles.logo} />
            <Text style={styles.title}>{labels.title}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{labels.requesterInfo}</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{labels.date}</Text>
            <View style={styles.valueWrapper}><Text style={styles.value}>{formatDate(data.createdAt)}</Text></View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{labels.no}</Text>
            <View style={styles.valueWrapper}><Text style={styles.value}>{eqCode}</Text></View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{labels.empCode}</Text>
            <View style={styles.valueWrapper}><Text style={styles.value}>{data.employee?.employee_code || data.user?.employee?.employee_code}</Text></View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{labels.name}</Text>
            <View style={styles.valueWrapper}><Text style={styles.value}>{data.employee?.employee_name_th || data.user?.employee?.employee_name_th}</Text></View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{labels.dept}</Text>
            <View style={styles.valueWrapper}><Text style={styles.value}>{data.employee?.department || data.user?.employee?.department}</Text></View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{labels.position}</Text>
            <View style={styles.valueWrapper}><Text style={styles.value}>{data.employee?.position || data.user?.employee?.position}</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{labels.details}</Text>
        <View style={styles.gridBox}>
          <View style={styles.gridSide}>
            <Text style={{ fontSize: 9 }}>{labels.purpose}</Text>
          </View>
          <View style={styles.gridContent}>
            <View style={{ width: '65%' }}>
              <View style={styles.checkBoxRow}>
                <View style={[styles.square, isType("REPAIR") ? styles.squareChecked : {}]}>
                  {isType("REPAIR") && <View style={styles.checkedDot} />}
                </View>
                <Text>{labels.repair}</Text>
              </View>
              <View style={styles.checkBoxRow}>
                <View style={[styles.square, isType("ACCESS") ? styles.squareChecked : {}]}>
                  {isType("ACCESS") && <View style={styles.checkedDot} />}
                </View>
                <Text>{labels.access}</Text>
              </View>
              <View style={styles.checkBoxRow}>
                <View style={[styles.square, isType("BORROW_ACC") ? styles.squareChecked : {}]}>
                  {isType("BORROW_ACC") && <View style={styles.checkedDot} />}
                </View>
                <Text>{labels.borrow}</Text>
              </View>
              <View style={styles.checkBoxRow}>
                <View style={[styles.square, isType("PURCHASE") ? styles.squareChecked : {}]}>
                  {isType("PURCHASE") && <View style={styles.checkedDot} />}
                </View>
                <Text>{labels.purchase}</Text>
              </View>
              <View style={styles.checkBoxRow}>
                <View style={[styles.square, isOther ? styles.squareChecked : {}]}>
                  {isOther && <View style={styles.checkedDot} />}
                </View>
                <Text>{labels.other} {isOther ? `: ${getTypeName(data.type_request)}` : ""}</Text>
              </View>
            </View>
            <View style={{ width: '35%', borderLeft: '0.5pt solid #ddd', paddingLeft: 15 }}>
              <View style={styles.checkBoxRow}>
                <View style={[styles.square, (data.priority === "LOW" || data.priority === "MEDIUM" || isEquipment) ? styles.squareChecked : {}]}>
                  {(data.priority === "LOW" || data.priority === "MEDIUM" || isEquipment) && <View style={styles.checkedDot} />}
                </View>
                <Text>{labels.normal}</Text>
              </View>
              <View style={styles.checkBoxRow}>
                <View style={[styles.square, (data.priority === "HIGH" || data.priority === "URGENT") ? styles.squareChecked : {}]}>
                  {(data.priority === "HIGH" || data.priority === "URGENT") && <View style={styles.checkedDot} />}
                </View>
                <Text>{labels.urgent}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailsBox}>
          <Text style={styles.boxTitle}>{labels.desc}</Text>
          {isEquipment ? (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0F1059' }}>{data.equipmentList?.equipmentEntry?.item_name || data.equipmentList?.equipmentEntry?.list || ""}</Text>
              <Text style={{ fontSize: 9, color: '#666' }}>Brand: {data.equipmentList?.equipmentEntry?.brand_name || ""} | Qty: {data.quantity}</Text>
              <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />
              <Text style={{ fontSize: 9 }}>Specs: {data.equipmentList?.equipmentEntry?.purchaseOrder?.detail || "No details provided."}</Text>
            </View>
          ) : (
            <Text style={{ marginBottom: 5 }}>{data.description}</Text>
          )}

          <Text style={[styles.sectionHeader, { marginTop: 15 }]}>{labels.reasonTitle}</Text>
          <Text style={{ marginBottom: 5 }}>{data.reason || labels.noReason}</Text>
        </View>

        <View style={styles.approvalSection}>
          {/* 1. Department Manager Section */}
          <View style={styles.approvalRow}>
            <View style={styles.approvalLeft}>
              <Text style={styles.sectionHeader}>{labels.mgrApproval}</Text>
              <Text style={styles.commentLabel}>{labels.comment}</Text>
              <View style={styles.dottedLineContainer}>
                {data.approval_comment ? (
                  <Text style={{ minHeight: 12, marginBottom: 5 }}>{data.approval_comment}</Text>
                ) : (
                  <>
                    <View style={styles.dottedLine} />
                    <View style={styles.dottedLine} />
                  </>
                )}
              </View>
            </View>

            <View style={styles.checkboxGroup}>
              <View style={styles.checkBoxRow}>
                <View style={[styles.square, data.approval_status === "APPROVED" ? styles.squareChecked : {}]} />
                <Text style={{ fontSize: 8 }}>{labels.approve}</Text>
              </View>
              <View style={styles.checkBoxRow}>
                <View style={[styles.square, data.approval_status === "REJECTED" ? styles.squareChecked : {}]} />
                <Text style={{ fontSize: 8 }}>{labels.reject}</Text>
              </View>
            </View>

            <View style={styles.approvalRight}>
              <View style={styles.signatureTable}>
                <View style={styles.sigTableHeader}>
                  <Text style={{ fontSize: 7 }}>{labels.signature}</Text>
                </View>
                <View style={styles.sigTableContent}>
                  <Text style={styles.sigText}>
                    {(data.approval_status === "APPROVED" || data.approval_status === "REJECTED") ? data.approval : ""}
                  </Text>
                </View>
                <View style={styles.sigTableFooter}>
                  <Text style={{ fontSize: 7 }}>
                    Date: {(data.approval_status === "APPROVED" || data.approval_status === "REJECTED") ? formatDate(data.approval_date) : ""}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 2. IT Department Section */}
          <View style={styles.approvalRow}>
            <View style={styles.approvalLeft}>
              <Text style={styles.sectionHeader}>{labels.itApproval}</Text>
              <Text style={styles.commentLabel}>{labels.comment}</Text>
              <View style={styles.dottedLineContainer}>
                {data.it_approval_comment ? (
                  <Text style={{ minHeight: 12, marginBottom: 5 }}>{data.it_approval_comment}</Text>
                ) : (
                  <>
                    <View style={styles.dottedLine} />
                    <View style={styles.dottedLine} />
                  </>
                )}
              </View>
            </View>

            <View style={styles.checkboxGroup}>
              <View style={styles.checkBoxRow}>
                <View style={[styles.square, data.it_approval_status === "APPROVED" ? styles.squareChecked : {}]} />
                <Text style={{ fontSize: 8 }}>{labels.approve}</Text>
              </View>
              <View style={styles.checkBoxRow}>
                <View style={[styles.square, data.it_approval_status === "REJECTED" ? styles.squareChecked : {}]} />
                <Text style={{ fontSize: 8 }}>{labels.reject}</Text>
              </View>
            </View>

            <View style={styles.approvalRight}>
              <View style={styles.signatureTable}>
                <View style={styles.sigTableHeader}>
                  <Text style={{ fontSize: 7 }}>{labels.signature}</Text>
                </View>
                <View style={styles.sigTableContent}>
                  <Text style={styles.sigText}>
                    {(data.it_approval_status === "APPROVED" || data.it_approval_status === "REJECTED") ? data.it_approval : ""}
                  </Text>
                </View>
                <View style={styles.sigTableFooter}>
                  <Text style={{ fontSize: 7 }}>
                    Date: {(data.it_approval_status === "APPROVED" || data.it_approval_status === "REJECTED") ? formatDate(data.it_approval_date) : ""}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>FM-IT-01 : Rev.01 : 19/09/2025</Text>
      </Page>
    </Document>
  );
};
