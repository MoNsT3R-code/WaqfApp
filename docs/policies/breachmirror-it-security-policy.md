# Information Technology Security and Usage Policy v7.0 (BreachMirror AI)

<!-- Imported from BreachMirror AI src/data/handbook-content.ts. XYZ Information Services Corp © 2026. Effective 2026-01-01, revised 2026-04-01. Scope: All XYZ Information Services Corp employees, contractors, endpoints, networks, and cloud environments. Do not edit by hand; run npm run policies:import. -->

## Security policy, section 1: Information Classification and Data Handling

Defines mandatory classification levels for all corporate data and controls handling of sensitive customer records. Key directives: All data must be classified into one of four tiers: Public, Internal, Confidential, or Restricted. Customer personally identifiable information (PII) and non-public financial records must always be classified as Confidential or Restricted. Confidential and Restricted data must never be stored in unapproved browser extensions, personal tools, or unencrypted local drives. Data classification markings must be preserved whenever information is exported, shared, or archived.

## Security policy 1.1: Classification Tiers (Information Classification and Data Handling)

All information assets created, received, or stored by XYZ Information Services Corp must be classified into four distinct levels: Public, Internal, Confidential, and Restricted. How confidential information should be classified: any information containing sensitive customer records, employee personal data, proprietary algorithms, financial accounts, or title documentation must be classified as Confidential or Restricted.

## Security policy 1.2: Labeling and Handling (Information Classification and Data Handling)

Employees must label all electronic documents and physical repositories with their corresponding classification. Confidential data must be encrypted at rest and in transit.

## Security policy 1.3: Unapproved Tools and Browser Extensions (Information Classification and Data Handling)

Personnel must never install or use unapproved browser extensions or unauthorized utilities that ingest, parse, or capture classified corporate data. Any plugin or extension must receive formal security clearance before installation.

## Security policy, section 2: Information Protection and Storage Controls

Governs local and external storage, encryption requirements, and prohibitions on syncing work files to consumer services. Key directives: Work documents and customer files must never be synced to personal Google Drive, personal Dropbox, iCloud, or unapproved external accounts. Removable storage media, including personal USB drives, are strictly prohibited on corporate workstations. Customer title documents and transaction records must be stored solely on encrypted corporate storage. Employees must use company-approved Microsoft OneDrive and SharePoint repositories with data loss prevention enabled.

## Security policy 2.1: Prohibition on Personal Cloud Storage (Information Protection and Storage Controls)

Can I sync work files to my personal Google Drive? No. Employees are strictly prohibited from copying, uploading, or syncing corporate files, customer data, or internal documentation to personal Google Drive, personal Dropbox, personal OneDrive, iCloud, or any consumer cloud storage service.

## Security policy 2.2: Removable Media (Information Protection and Storage Controls)

Connecting unauthorized USB flash drives, external hard drives, or personal storage hardware to corporate endpoints is strictly prohibited. All corporate endpoints enforce automated USB blocking.

## Security policy 2.3: Encryption Standards (Information Protection and Storage Controls)

All data resting on corporate endpoints or in cloud repositories must use AES-256 encryption. Files containing sensitive customer information must remain within sanctioned corporate repositories at all times.

## Security policy, section 3: Authentication, Password Policy, and Access Control

Sets requirements for password length, multi-factor authentication (MFA), and incident protocols for unauthorized push notifications. Key directives: Passwords must be at least 14 characters long and include uppercase, lowercase, numerals, and special symbols. Multi-factor authentication (MFA) is mandatory across all corporate accounts and services without exception. Employees must immediately reject and report any unexpected or unprompted MFA push notifications. Sharing credentials, reusing passwords across multiple accounts, or writing down passwords is strictly prohibited.

## Security policy 3.1: Password Requirements (Authentication, Password Policy, and Access Control)

What are the password requirements? All user accounts must use passwords that are at least 14 characters long, incorporating uppercase letters, lowercase letters, numbers, and special symbols. Passwords must not contain personal identifiers, dictionary words, or previously used sequences. Passwords must be changed immediately if compromise is suspected.

## Security policy 3.2: Multi-Factor Authentication (MFA) (Authentication, Password Policy, and Access Control)

MFA is mandatory for all system access. Push notifications must only be approved when actively initiated by the user.

## Security policy 3.3: Unexpected MFA Prompts (Authentication, Password Policy, and Access Control)

I got an MFA prompt I did not trigger, what now? If an employee receives an MFA prompt or authentication push that they did not initiate, they must immediately deny the request and report the event within 1 hour to the Security Operations Center. Do not approve repeated prompts under any circumstance.

## Security policy, section 4: Corporate Ownership, Privacy Expectations, and Asset Return

Clarifies that employees have no expectation of privacy on corporate systems and outlines mandatory hardware return upon separation. Key directives: The company actively monitors work emails, messages, network traffic, and system activity; employees have no expectation of personal privacy. All issued hardware, laptops, monitors, and tokens remain the exclusive property of XYZ and must be returned upon termination. Employees must return all company property immediately on or before their final day of employment. Corporate communication channels must not be used for illegal activities or unauthorized business operations.

## Security policy 4.1: System Monitoring and Privacy Expectations (Corporate Ownership, Privacy Expectations, and Asset Return)

Does the company monitor my work email? Yes. All communications, files, email messages, internet traffic, and activities conducted on company-provided computers, mobile devices, and networks are company property. Employees should have no expectation of privacy when using corporate systems. XYZ reserves the right to audit, monitor, and review all communications.

## Security policy 4.2: Return of Company Assets (Corporate Ownership, Privacy Expectations, and Asset Return)

Do I have to return my laptop when I leave the company? Yes. All company-issued laptops, mobile phones, security keys, peripherals, and physical documents must be returned to IT asset management on or before an employee's separation date. Failure to return corporate assets may result in legal recovery action.

## Security policy, section 5: Artificial Intelligence and Machine Learning Usage Policy

Governs the use of public generative AI, prohibiting pasting customer data into consumer tools like ChatGPT. Key directives: Employees must never paste customer data, escrow numbers, confidential contracts, or trade secrets into public AI models like ChatGPT. Only enterprise AI tools approved by the XYZ AI Council may be used for work-related tasks. All prompts, inputs, and code generated by AI must be reviewed for security and IP compliance prior to deployment. AI tools must not be granted direct access to production databases or sensitive transaction pipelines.

## Security policy 5.1: Public Generative AI Tools (Artificial Intelligence and Machine Learning Usage Policy)

Can I paste customer data into ChatGPT? Absolutely not. Employees are strictly forbidden from inputting, pasting, or uploading customer personal data, loan amounts, title documents, proprietary source code, or confidential business details into consumer AI tools, including ChatGPT, Claude, Gemini consumer, or third-party web assistants.

## Security policy 5.2: Enterprise AI Governance (Artificial Intelligence and Machine Learning Usage Policy)

The use of generative AI tools is permitted only through sanctioned enterprise subscriptions reviewed and approved by the XYZ AI Council.

## Security policy 5.3: Review of AI Output (Artificial Intelligence and Machine Learning Usage Policy)

All work products assisted by AI tools must be independently verified by personnel for accuracy and security before being shared with clients or committed to repositories.

## Security policy, section 6: Device Management and Physical Endpoint Security

Controls physical endpoint protection, screen locking, device encryption, and protocols for lost or stolen company laptops. Key directives: Lost or stolen company laptops must be reported immediately to the Helpdesk and SOC within 1 hour. All endpoints must have full-disk BitLocker encryption active and enrolled in corporate MDM. Workstations must be locked whenever left unattended; screens must auto-lock after 5 minutes of inactivity. Laptops must never be left unattended in public vehicles, airport lounges, or unsecured hotel rooms.

## Security policy 6.1: Lost or Stolen Equipment (Device Management and Physical Endpoint Security)

What should I do if I lose my company laptop? If your company laptop, tablet, or phone is lost, stolen, or misplaced, you must report it immediately to the IT Helpdesk and Security Operations Center (SOC) within 1 hour. This prompt reporting allows security engineers to initiate remote wipe protocols and revoke active session tokens.

## Security policy 6.2: Physical Security and Screen Locking (Device Management and Physical Endpoint Security)

Employees must lock their screens whenever stepping away from their desk. Laptops must be securely stored when traveling and never left visible in unattended vehicles.

## Security policy 6.3: Asset Recovery (Device Management and Physical Endpoint Security)

Laptops and corporate equipment must be returned immediately upon termination of employment or when requested by management.

## Security policy, section 7: Network Security and Remote Access Policy

Outlines rules for remote work, prohibiting unprotected public Wi-Fi usage and mandating corporate VPN. Key directives: When working on airport public wifi, hotel Wi-Fi, or coffee shop networks, employees must always connect through corporate VPN. Direct transmission of sensitive credentials or work files over open, unencrypted wireless networks is strictly prohibited. Split-tunneling must not be disabled or circumvented on corporate laptops. Remote desktop access to internal resources is permitted only through authenticated, encrypted bastions.

## Security policy 7.1: Remote Work and Public Networks (Network Security and Remote Access Policy)

Is it OK to work on airport public wifi? Yes, but only when using the company-managed VPN. Employees working from airports, hotels, cafes, or public venues must connect to the corporate VPN before accessing any company email, portals, or customer data. Working on open, unsecured public Wi-Fi without VPN encryption is strictly prohibited.

## Security policy 7.2: Network Segmentation (Network Security and Remote Access Policy)

Remote workers must ensure home Wi-Fi networks use WPA2 or WPA3 encryption with non-default administrator passwords.

## Security policy 7.3: Unauthorized Network Bridging (Network Security and Remote Access Policy)

Bridging corporate networks with personal local area networks or connecting unauthorized hotspots to corporate laptops is prohibited.

## Security policy, section 8: Cloud Applications, SaaS Software, and Browser Extensions

Regulates approved software installations, banning unvetted browser plugins and shadow IT cloud services. Key directives: Employees must not install unauthorized browser extensions or third-party add-ons on corporate browsers. All cloud applications and SaaS vendors must complete a third-party risk assessment prior to handling company data. Syncing corporate data to personal cloud storage or unapproved collaboration tools is prohibited. Software installations require administrative elevation and approval from the IT Architecture board.

## Security policy 8.1: Browser Extensions and Third-Party Plugins (Cloud Applications, SaaS Software, and Browser Extensions)

Can I install a browser extension that is not approved? No. Employees must not install unapproved browser extensions, browser add-ons, or unvetted plugins. Many browser extensions harvest keystrokes, clipboard contents, and browsing history. Only extensions listed in the corporate enterprise catalog are permitted.

## Security policy 8.2: Shadow IT Prohibition (Cloud Applications, SaaS Software, and Browser Extensions)

Employees are prohibited from signing up for third-party cloud tools, storage services, or SaaS platforms using corporate credentials without formal procurement and security assessment.

## Security policy 8.3: Cloud Data Storage (Cloud Applications, SaaS Software, and Browser Extensions)

Work files must only be stored within corporate-managed cloud environments such as Microsoft 365, Azure, or approved Google Workspace instances.

## Security policy, section 9: Incident Reporting, Phishing, and Non-Retaliation Policy

Mandates reporting of phishing attempts, lost devices, or suspicious events within 1 hour, guaranteeing non-retaliation for good-faith reports. Key directives: Employees must report suspected phishing emails immediately using the Outlook Report Phishing button or by emailing security. Security breaches, anomalous MFA prompts, and misplaced laptops must be reported within 1 hour of discovery. XYZ strictly prohibits retaliation against any employee who makes a good-faith report of a security incident or policy breach. Employees must never attempt to investigate or interact with active malware or threat actors independently.

## Security policy 9.1: Reporting Security Incidents (Incident Reporting, Phishing, and Non-Retaliation Policy)

How do I report a phishing email? Employees who receive a suspicious email must report it immediately using the 'Report Phishing' button in the email client, or by forwarding the email as an attachment to phishing@xyz.com or security@xyz.com. Suspected malware, lost laptops, or anomalous MFA notifications must also be reported to the SOC within 1 hour.

## Security policy 9.2: Non-Retaliation Protection (Incident Reporting, Phishing, and Non-Retaliation Policy)

Am I protected from retaliation if I report misconduct to the hotline or report a security mistake? Yes. XYZ maintains a zero-tolerance policy against retaliation. Any employee who reports a suspected security breach, accidental data exposure, or ethical violation in good faith will be protected from reprisal, harassment, or adverse employment consequences.

## Security policy 9.3: Incident Response Cooperation (Incident Reporting, Phishing, and Non-Retaliation Policy)

Employees must fully cooperate with Security Operations personnel during incident triage and containment.

## Security policy, section 10: Policy Enforcement, Disciplinary Actions, and Compliance

Specifies penalties and enforcement mechanisms for willful policy non-compliance and security infractions. Key directives: Violations of this security policy may lead to disciplinary action up to and including immediate termination of employment. Willful data exfiltration or credential compromise may result in civil litigation and criminal referral. Managers are responsible for ensuring team compliance with all information security standards. Ignorance of policy directives does not excuse non-compliance.

## Security policy 10.1: Disciplinary Framework (Policy Enforcement, Disciplinary Actions, and Compliance)

What happens if I violate the security policy? Violations of this Information Technology Security Policy, whether through willful misconduct, gross negligence, or intentional circumvention of security controls, will result in disciplinary action up to and including termination of employment. In cases involving deliberate data theft, escrow fraud, or unauthorized disclosure, XYZ may pursue civil action and criminal prosecution.

## Security policy 10.2: Mandatory Annual Recertification (Policy Enforcement, Disciplinary Actions, and Compliance)

All employees must review and sign the annual Information Security Acknowledgment and pass the security exam.

## Security policy 10.3: Exceptions (Policy Enforcement, Disciplinary Actions, and Compliance)

Any temporary exception to these policies must be documented, approved by the Chief Information Security Officer (CISO), and reviewed periodically.
