import { jest } from '@jest/globals';
import axios from 'axios';
import FormData from 'form-data';
import openkmService from '../../src/services/openkm.service.js';

describe('OpenKM Service', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('uploadDocument', () => {
    it('should successfully upload a document to the specified endpoint', async () => {
      // Mock File object
      const mockFile = {
        originalname: 'test.pdf',
        buffer: Buffer.from('test representation')
      };
      
      const targetPath = '/okm:root/docs/';
      const title = 'customTitle';

      // Mock the successful axios post response
      const mockOpenKmResponse = {
        data: {
          uuid: 'test-uuid-1234',
          path: '/okm:root/docs/customTitle.pdf'
        }
      };
      const axiosSpy = jest.spyOn(axios, 'post').mockResolvedValue(mockOpenKmResponse);

      const result = await openkmService.uploadDocument(mockFile, targetPath, title);

      // Verify FormData and Axios calls
      expect(axiosSpy).toHaveBeenCalledTimes(1);
      
      // Expected Endpoint URL
      const expectedUrl = `${openkmService.baseURL}/document/createSimple`;
      expect(axiosSpy).toHaveBeenCalledWith(
        expectedUrl,
        expect.any(FormData), // Checking if form-data instance passed
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      );
      
      // Should return extracted data
      expect(result).toEqual(mockOpenKmResponse.data);
    });

    it('should throw an error when the upload fails', async () => {
      const mockFile = { originalname: 'test.pdf', buffer: Buffer.from('') };
      
      const mockError = {
        response: {
          data: { message: 'Invalid target path' }
        }
      };
      jest.spyOn(axios, 'post').mockRejectedValue(mockError);

      await expect(
        openkmService.uploadDocument(mockFile, '/okm:root/wrong/', 'doc')
      ).rejects.toThrow('Failed to upload document to OpenKM. Invalid target path');
    });
  });

  describe('publishDocument', () => {
    it('should successfully publish a document endpoint', async () => {
      // Since publish is simulated to return true, we just test that logic.
      // If the real axios call is uncommented later, the test should be updated.
      const result = await openkmService.publishDocument('test-uuid-1234');
      
      expect(result).toBe(true);
    });
  });

});
