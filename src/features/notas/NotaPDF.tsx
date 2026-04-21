import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 30 },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  folio: { fontSize: 14, color: '#666', marginTop: 10 },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCell: { margin: 'auto', marginTop: 5, fontSize: 10 }
});

export const NotaDocument = ({ nota }: { nota: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Nota de Remisión</Text>
        <Text style={styles.folio}>Folio: {nota?.folio || 'Borrador'}</Text>
      </View>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Cant.</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Descripción</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>P. Unit</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Importe</Text></View>
        </View>
        {/* Table Body */}
        {(nota?.items || []).map((item: any, i: number) => (
          <View style={styles.tableRow} key={i}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.cantidad}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.descripcion || item.producto?.nombre}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>${item.precioUnitario}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>${item.subtotal}</Text></View>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 20, alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 12 }}>Subtotal: ${nota?.subtotal || 0}</Text>
        <Text style={{ fontSize: 12 }}>Descuento: ${nota?.descuento || 0}</Text>
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Total: ${nota?.total || 0}</Text>
      </View>
    </Page>
  </Document>
);

export const NotaPDFViewer = ({ nota }: { nota: any }) => (
  <PDFViewer width="100%" height="600px">
    <NotaDocument nota={nota} />
  </PDFViewer>
);
