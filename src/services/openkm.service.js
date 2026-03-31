import axios from 'axios';
import FormData from 'form-data';

class OpenKMService {
  constructor() {
    this.baseURL = process.env.OPENKM_BASE_URL + '/services/rest';
    this.authConfig = {
      auth: {
        username: process.env.OPENKM_USERNAME,
        password: process.env.OPENKM_PASSWORD
      },
      headers: {
        'Accept': 'application/json',
      }
    };
  }

  /**
   * Mengunggah file physical ke server OpenKM
   * @param {Object} file - Object multer file
   * @param {String} targetPath - Path/Folder di OpenKM (contoh: /okm:root/KMS_Metodologi)
   */
  async uploadDocument(file, targetPath, title) {
    try {
      const docPath = `${targetPath}/${title || file.originalname}`;
      
      const form = new FormData();
      form.append('docPath', docPath);
      // Asumsi API form-data upload OpenKM (contoh)
      form.append('content', file.buffer, file.originalname);

      // Gunakan interceptor atau config khusus untuk FormData headers (mulipart boundary)
      const config = {
        ...this.authConfig,
        headers: {
          ...this.authConfig.headers,
          ...form.getHeaders()
        }
      };

      // Contoh hit endpoint Create Document (sesuaikan dgn dokumentasi API OpenKM real)
      const response = await axios.post(`${this.baseURL}/document/create`, form, config);
      
      return response.data; // Biasanya me-return Object Document OpenKM (beserta properties uuid, path, dll)
    } catch (error) {
       console.error('Error uploading to OpenKM:', error.response?.data || error.message);
       throw new Error('Failed to upload document to OpenKM. ' + (error.response?.data?.message || ''));
    }
  }

  /**
   * Merubah properti/kategori/status dokumen di sisi OpenKM
   * Untuk simulasi dari "Unpublished" menjadi "Published" 
   * (Misal dengan menyematkan metadata khusus atau memindahkan status)
   */
  async publishDocument(docUuid) {
     try {
       // Hit API Edit Property/Status di OpenKM
       // Simulasi (Karena REST API OpenKM spesifik butuh XML/JSON payload tergantung versinya)
       /*
        const payload = { ... }
        await axios.put(`${this.baseURL}/document/setProperty/${docUuid}`, payload, this.authConfig);
       */
       
       return true;
     } catch (error) {
       console.error('Error publishing in OpenKM:', error.response?.data || error.message);
       throw new Error('Failed to publish document in OpenKM');
     }
  }
}

export default new OpenKMService();
