# Privacy Policy for Live OCR

**Last Updated: May 21, 2026**

This Privacy Policy describes how the Live OCR mobile application ("the App") collects, uses, stores, and shares user information. The App is developed and operated as a local document utility tools app.

By downloading, installing, or using the App, you agree to the collection and use of information in accordance with this policy.

---

## 1. Information Collection and Use

The App is designed with a strong focus on user privacy. Most of the App's functions operate entirely offline and process data locally on your device.

### A. On-Device Text Recognition (OCR)
The App uses Google ML Kit OCR to recognize and extract text from images. All image processing and text extraction are performed **entirely on your mobile device**. 
* **No images** captured by your camera or loaded from your gallery are uploaded to external servers for text recognition.
* **No recognized text** is sent to our servers.

### B. Local Storage of Documents
Any documents, text files, and PDFs you generate or save within the App are stored locally on your device's internal storage or public directories (e.g., your device's `Download` folder). 
* The list of saved documents, favorites, and file metadata is saved locally using `AsyncStorage` on your device.
* We do not have access to your saved files or history.

### C. Advertisements (Third-Party Collection)
The App displays advertisements to support development using **Google AdMob (Google Mobile Ads)**. Google AdMob may collect and process device-specific information, such as:
* Mobile advertising identifiers (e.g., Google Advertising ID).
* IP addresses and network connection details.
* App usage data and performance metrics related to ad delivery.
* Cookies and web beacons.

For more information on how Google AdMob handles your data, please refer to Google's policies:
* [Google Privacy & Terms](https://policies.google.com/privacy)
* [How Google uses information from sites or apps that use our services](https://policies.google.com/technologies/partner-sites)

---

## 2. Device Permissions Required

To provide its core features, the App requests access to certain device permissions. You can control these permissions at any time through your device settings:

* **Camera Permission (`android.permission.CAMERA`)**: Used to capture images of documents or text in real-time to perform text recognition (OCR).
* **Storage Permissions (`READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES`, `MANAGE_EXTERNAL_STORAGE`)**: 
  * Required to browse and select images from your gallery for scanning.
  * Required to export and save your recognized texts as PDF, DOC, or TXT files directly to your device's `Download` directory.
* **Audio Permission (`RECORD_AUDIO`)**: Declared by the camera framework. The App **does not record, store, or transmit any audio files**.
* **Internet Permission (`android.permission.INTERNET`)**: Required to fetch and display ads from Google AdMob.

---

## 3. Data Sharing and Transmission

Except for the third-party ad networks (Google AdMob) detailed in Section 1, **we do not share, sell, trade, or transmit any of your personal information, scanned text, or files to third parties**. 

Any file sharing (e.g., emailing a PDF, sending text to messaging apps) is initiated solely by you using the Android system's native Share Sheet.

---

## 4. Data Retention and Deletion

Since your data is stored locally on your device:
* Your files and search history remain on your device until you delete them within the App.
* All locally stored App data (including document history and favorites metadata) is deleted permanently when you uninstall the App from your device.
* Files exported to public folders (like the `Download` folder) will remain on your device even after the App is uninstalled, and can be deleted manually using your device's file manager.

---

## 5. Children's Privacy

The App does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. Since we do not collect personal data on our servers, we have no database of user information. If Google AdMob collects children's data, it does so in accordance with Google's family policies and COPPA regulations.

---

## 6. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. You are advised to review this page periodically for any changes. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top.

---

## 7. Contact Us

If you have any questions or suggestions about this Privacy Policy, please contact us at:

* **Developer Name/Company:** [Your Name / Company Name]
* **Email:** [Your Support Email Address]
