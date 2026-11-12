## **Secure SDLC Guidelines**

Security is a shared responsibility, integral to every stage of the development lifecycle. This aligns with our "Shift Left" security philosophy, where all engineers are accountable for security.

### **1\. Design & Planning (Threat Modeling)**

Before writing code for a new feature, consider the security implications:

* **Data Sensitivity:** What data are we handling? Does it include PII (Personally Identifiable Information)?  
* **Trust Boundaries:** Where does data enter the system from an untrusted source (API, User Input, Third-party Webhook)?  
* **Abuse Cases:** How could a malicious actor intentionally misuse this feature?

**Action:** For high-risk features, perform a mini-Threat Model. [Engage Cyber](https://docs.google.com/forms/d/e/1FAIpQLSfYl7PCVXsh5fqZeRZ-OeTErodkvpp12JxZl7YgfoZjXAdsdA/viewform) if you need any assistance.

### **2\. Development (Secure Coding)**

* **Input Validation:** Treat all external data as hostile. Use allow-lists and strong type checking.  
* **Parameterized Queries:** Never use string concatenation for database queries; use prepared statements to prevent SQL Injection.  
* **Least Privilege:** Ensure the code only has the minimum permissions necessary to perform its task.  
* **Secret Management:** Use the [organization's Secret Vault](https://woolworths-agile.atlassian.net/wiki/spaces/CS/pages/33773748289/Secrets+Management) (e.g., HashiCorp Vault, AWS Secrets Manager, Azure Key Vault) instead of hardcoding credentials. [Remove](https://woolworths-agile.atlassian.net/wiki/x/SAEi6Qc) existing hardcoded secrets from the code.

### **3\. Continuous Integration (Automated Testing)**

Every PR must pass the following security gates:

* **SAST (Static Analysis):** [Snyk](https://docs.google.com/document/d/11FvZi6WmiqCvRqFea3GPFDKIXt3II2172Fc4cuidCS0/edit?usp=sharing) code scan must return zero "High" alerts.  
* **SCA (Dependency Scan):** All third-party libraries must be free of known vulnerabilities.  
* **IaC and Container Scanning**: [Orca](https://docs.google.com/forms/d/e/1FAIpQLSdO7lH3Loty0xWihVBnOs9YrcqVcl-Flk2vo5F3jRk5KooU0g/viewform) scan must return zero “Critical” and “High” alerts.  
* **Secret Scanning:** No new secrets can be detected.

### **4\. Deployment & Monitoring**

* **Audit Logs:** Ensure significant actions (logins, permission changes, data exports) are logged.

