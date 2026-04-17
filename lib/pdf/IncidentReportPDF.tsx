import React from "react";
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
    fontSize: 10,
    color: '#000',
    display: 'flex',
    flexDirection: 'column',
  },
  headerBox: {
    flexDirection: 'row',
    border: '1pt solid #000',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10
  },
  logoContainer: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  logo: {
    width: 60,
    height: 40,
    objectFit: 'contain'
  },
  brandText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F1059'
  },
  brandSub: {
    fontSize: 6,
    color: '#0F1059',
    position: 'absolute',
    bottom: -8,
    left: 10
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  partHeader: {
    backgroundColor: '#ccc',
    padding: 5,
    fontWeight: 'bold',
    fontSize: 10,
    borderBottom: '1pt solid #fff',
    marginTop: 5
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5
  },
  col: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: 10
  },
  colLabel: {
    marginRight: 5
  },
  colValue: {
    fontWeight: 'bold',
    flex: 1,
    borderBottom: '1pt dotted #000'
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5
  },
  checkboxItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  square: {
    width: 12,
    height: 12,
    border: '1pt solid #000',
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  squareChecked: {
    backgroundColor: '#333'
  },
  checkedDot: {
    width: 4,
    height: 4,
    backgroundColor: '#FFF',
    borderRadius: 2
  },
  detailsBox: {
    border: '1pt solid #000',
    padding: 5,
    minHeight: 60,
    marginTop: 2
  },
  signBlockGrid: {
    flexDirection: 'row',
    border: '1pt solid #000',
    marginTop: 10,
    height: 60
  },
  signLeft: {
    width: '33.33%',
    borderRight: '1pt solid #000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5
  },
  signCenter: {
    width: '33.33%',
    borderRight: '1pt solid #000',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 5
  },
  signRight: {
    width: '33.33%',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 5,
    fontSize: 7
  },
  approvalsGrid: {
    flexDirection: 'row',
    border: '1pt solid #000',
    marginTop: 10,
    height: 80
  },
  approvalCol: {
    flex: 1,
    borderRight: '1pt solid #000',
    flexDirection: 'column'
  },
  approvalColLast: {
    flex: 1,
    flexDirection: 'column'
  },
  approvalHeader: {
    padding: 5,
    textAlign: 'center',
    fontSize: 8
  },
  approvalHeaderSub: {
    fontSize: 5,
    marginTop: 1
  },
  approvalSignBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: '#0000FF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  approvalCommentBox: {
    flex: 1,
    padding: 5,
    fontSize: 7
  },
  approvalFooter: {
    borderTop: '1pt solid #000',
    padding: 3,
    fontSize: 9
  },
  footerText: {
    textAlign: 'right',
    fontSize: 6,
    color: '#666',
    marginTop: 10
  }
});

interface IncidentReportPDFProps {
  data: any;
  locale?: 'en' | 'th';
}

export const IncidentReportPDF: React.FC<IncidentReportPDFProps> = ({ data }) => {
  if (!data) return null;

  const fmtDate = (d: string) => {
    if (!d) return "..........................................";
    const date = new Date(d);
    return date.toLocaleString('th-TH', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const fmtJustDate = (d: string) => {
    if (!d) return "..........................................";
    const date = new Date(d);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  };

  const isType = (key: string) => data.incidentType === key;

  return (
    <Document title={`INC_${data.report_code || "REPORT"}`}>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.headerBox}>
          <View style={styles.logoContainer}>
            <Image src="/logo/NDC-LOGO-04.png" style={styles.logo} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>แบบฟอร์มรายงานเหตุการณ์ผิดปกติ</Text>
            <Text style={styles.subTitle}>(Incident Report Form)</Text>
          </View>
        </View>

        {/* Part 1 */}
        <Text style={styles.partHeader}>ส่วนที่ 1 ผู้รายงานเหตุการณ์ผิดปกติ (Incident Reporter)</Text>
        <View style={{ padding: 5, fontSize: 8 }}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.colLabel}>วัน/เวลาเกิดเหตุ (Incident Time) :</Text>
              <Text style={styles.colValue}>{fmtDate(data.incidentTime)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.colLabel}>สถานที่/ระบบที่เกี่ยวข้อง (Locations / Systems) :</Text>
              <Text style={styles.colValue}>{data.location}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.colLabel}>รหัสพนักงาน (Emp ID) :</Text>
              <Text style={styles.colValue}>{data.employeeCode}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.colLabel}>ชื่อ (Name) :</Text>
              <Text style={styles.colValue}>{data.reporterName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.colLabel}>แผนก (Dept) :</Text>
              <Text style={styles.colValue}>{data.department}</Text>
            </View>
          </View>

          <Text style={{ marginTop: 5 }}>ประเภทเหตุการณ์ (Incident Type)</Text>
          <View style={styles.checkboxGrid}>
            <View style={styles.checkboxItem}>
              <View style={[styles.square, isType('MALWARE') ? styles.squareChecked : {}]}>
                {isType('MALWARE') && <View style={styles.checkedDot} />}
              </View>
              <Text>ไวรัส (Malware)</Text>
            </View>
            <View style={styles.checkboxItem}>
              <View style={[styles.square, isType('HUMAN_ERROR') ? styles.squareChecked : {}]}>
                {isType('HUMAN_ERROR') && <View style={styles.checkedDot} />}
              </View>
              <Text>ความผิดพลาดของคน (Human Error)</Text>
            </View>
            <View style={styles.checkboxItem}>
              <View style={[styles.square, isType('SYSTEM_DOWN') ? styles.squareChecked : {}]}>
                {isType('SYSTEM_DOWN') && <View style={styles.checkedDot} />}
              </View>
              <Text>ระบบล่ม (System Down)</Text>
            </View>
            <View style={styles.checkboxItem}>
              <View style={[styles.square, isType('UNAUTHORIZED_ACCESS') ? styles.squareChecked : {}]}>
                {isType('UNAUTHORIZED_ACCESS') && <View style={styles.checkedDot} />}
              </View>
              <Text>เข้าถึงโดยไม่ได้รับอนุญาต (Unauthorized Access)</Text>
            </View>
            <View style={[styles.checkboxItem, { width: '100%' }]}>
              <View style={[styles.square, isType('OTHER') ? styles.squareChecked : {}]}>
                {isType('OTHER') && <View style={styles.checkedDot} />}
              </View>
              <Text>อื่นๆ (Other) : </Text>
              <Text style={{ borderBottom: '1pt dotted #000', flex: 1, marginLeft: 5 }}>
                {isType('OTHER') ? data.incidentTypeOther : ''}
              </Text>
            </View>
          </View>

          <Text style={{ marginTop: 5 }}>รายละเอียดเหตุการณ์ (Incident Details)</Text>
          <View style={styles.detailsBox}>
            <Text>{data.details}</Text>
          </View>

          {/* Reporter Sign */}
          <View style={styles.signBlockGrid}>
            <View style={styles.signLeft}>
              <Text>ลงชื่อผู้รายงานเหตุการณ์ผิดปกติ</Text>
              <Text style={{ fontSize: 5, marginTop: 2 }}>Sign Incident Reporter</Text>
            </View>
            <View style={styles.signCenter}>
              <Text style={{ fontSize: 12, color: '#0F1059', fontWeight: 'bold' }}>{data.reporterSign}</Text>
              {!data.reporterSign && <Text>....................................................</Text>}
            </View>
            <View style={styles.signRight}>
              <Text>Date: {fmtJustDate(data.reportSignatureDate)}</Text>
            </View>
          </View>
        </View>

        {/* Part 2 */}
        <Text style={[styles.partHeader, { marginTop: 15 }]}>ส่วนที่ 2 ผู้แก้ไข (Maintenance Technician)</Text>
        <View style={{ padding: 5, fontSize: 8 }}>
          <Text>สาเหตุของปัญหา (Cause of the problem)</Text>
          <View style={styles.detailsBox}>
            <Text>{data.cause}</Text>
          </View>

          <View style={[styles.row, { marginTop: 5, alignItems: 'center' }]}>
            <View style={[styles.col, { flex: 1.5 }]}>
              <Text style={styles.colLabel}>วันที่แก้ไข (Date to Maintenance) :</Text>
              <Text style={styles.colValue}>{fmtDate(data.maintenanceDate)}</Text>
            </View>
            <View style={[styles.col, { flex: 2, alignItems: 'center' }]}>
              <View style={[styles.square, data.repairType === 'EXTERNAL' ? styles.squareChecked : {}]}>
                {data.repairType === 'EXTERNAL' && <View style={styles.checkedDot} />}
              </View>
              <Text style={{ marginRight: 15 }}>ส่งซ่อมภายนอก / External Repair</Text>
              
              <View style={[styles.square, data.repairType === 'INTERNAL' ? styles.squareChecked : {}]}>
                {data.repairType === 'INTERNAL' && <View style={styles.checkedDot} />}
              </View>
              <Text>ซ่อมภายใน / Internal Repair</Text>
            </View>
          </View>

          <Text style={{ marginTop: 5 }}>รายละเอียดการแก้ไข (Detail of Maintenance)</Text>
          <View style={styles.detailsBox}>
            <Text>{data.resolution}</Text>
          </View>

          <Text style={{ marginTop: 5 }}>แนวทางการป้องกัน (Prevention Guidelines)</Text>
          <View style={styles.detailsBox}>
            <Text>{data.prevention}</Text>
          </View>

          {/* Approvals */}
          <View style={styles.approvalsGrid}>
            <View style={styles.approvalCol}>
              <View style={styles.approvalHeader}>
                <Text>ผู้รับผิดชอบ</Text>
                <Text style={styles.approvalHeaderSub}>Responsible maintenance</Text>
              </View>
              <View style={styles.approvalSignBox}>
                <Text>{data.responsibleSign}</Text>
              </View>
              <View style={styles.approvalFooter}>
                <Text>Date: {fmtJustDate(data.responsibleDate)}</Text>
              </View>
            </View>

            <View style={styles.approvalCol}>
              <View style={styles.approvalHeader}>
                <Text>ผู้ทบทวน</Text>
                <Text style={styles.approvalHeaderSub}>Review By</Text>
              </View>
              <View style={styles.approvalSignBox}>
                <Text>{data.reviewerSign}</Text>
              </View>
              <View style={styles.approvalFooter}>
                <Text>Date: {fmtJustDate(data.reviewerDate)}</Text>
              </View>
            </View>

            <View style={styles.approvalColLast}>
               <View style={styles.approvalHeader}>
                <Text>หมายเหตุ</Text>
                <Text style={styles.approvalHeaderSub}>Comment</Text>
              </View>
              <View style={styles.approvalCommentBox}>
                <Text>{data.maintenanceComment}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.footerText}>FM-IT-07 : Rev.00 : 19/9/2025</Text>
      </Page>
    </Document>
  );
};
