# स्कूल मैनेजमेंट सिस्टम — यूज़र गाइड (हिंदी)

**यह गाइड किसके लिए है:** Admin, Teacher, Student, Parent — सभी के लिए  
**भाषा:** हिंदी (सरल)  
**Version:** 1.0

---

## विषय सूची (Table of Contents)

1. [सिस्टम का परिचय](#1-सिस्टम-का-परिचय)
2. [Login कैसे करें](#2-login-कैसे-करें)
3. [Admin Guide](#3-admin-guide)
   - [Dashboard](#31-dashboard)
   - [Students — छात्र प्रबंधन](#32-students--छात्र-प्रबंधन)
   - [Teachers — शिक्षक प्रबंधन](#33-teachers--शिक्षक-प्रबंधन)
   - [Attendance — उपस्थिति](#34-attendance--उपस्थिति)
   - [Fees — फीस प्रबंधन](#35-fees--फीस-प्रबंधन)
   - [Results — परिणाम](#36-results--परिणाम)
   - [Notices — सूचनाएं](#37-notices--सूचनाएं)
   - [Timetable — समय-सारणी](#38-timetable--समय-सारणी)
   - [Exam Schedule — परीक्षा कार्यक्रम](#39-exam-schedule--परीक्षा-कार्यक्रम)
   - [WhatsApp Setup](#310-whatsapp-setup)
   - [Gallery — गैलरी](#311-gallery--गैलरी)
4. [Teacher Guide](#4-teacher-guide)
5. [Student Guide](#5-student-guide)
6. [Parent Guide](#6-parent-guide)
7. [Password बदलना](#7-password-बदलना)
8. [WhatsApp Notifications](#8-whatsapp-notifications)
9. [सामान्य समस्याएं और समाधान](#9-सामान्य-समस्याएं-और-समाधान)

---

## 1. सिस्टम का परिचय

यह एक **स्कूल मैनेजमेंट सिस्टम** है जिससे स्कूल के सभी काम आसानी से ऑनलाइन किए जा सकते हैं।

### इस सिस्टम में क्या-क्या होता है?

| काम | विवरण |
|---|---|
| छात्र प्रबंधन | नए छात्र जोड़ना, जानकारी देखना, ID Card बनाना |
| शिक्षक प्रबंधन | शिक्षकों का रिकॉर्ड रखना |
| उपस्थिति | रोज़ की हाजिरी लगाना |
| फीस | फीस जमा करना, रसीद देना |
| परिणाम | परीक्षा के नंबर डालना |
| समय-सारणी | क्लास का टाइमटेबल बनाना |
| परीक्षा कार्यक्रम | परीक्षा की तारीख और समय |
| WhatsApp | Parents को automatic message भेजना |
| सूचनाएं | स्कूल की Notice सभी तक पहुंचाना |

### 4 प्रकार के Users

```
Admin     → स्कूल प्रशासक (सब कुछ कर सकता है)
Teacher   → शिक्षक (अपनी कक्षा का काम कर सकता है)
Student   → छात्र (अपनी जानकारी देख सकता है)
Parent    → अभिभावक (अपने बच्चे की जानकारी देख सकता है)
```

---

## 2. Login कैसे करें

### Step 1 — Browser में खोलें

अपने phone या computer के browser (Chrome, Firefox) में यह address खोलें:

```
http://आपके-सर्वर-का-IP/login.html
```

उदाहरण: `http://152.67.10.25/login.html`

---

### Step 2 — Email और Password डालें

![Login Page]

- **Email:** अपना email address डालें
- **Password:** अपना password डालें
- **Sign In** button दबाएं

---

### Step 3 — Dashboard खुलेगा

Login होने के बाद आप अपने role के अनुसार Dashboard पर पहुंच जाएंगे।

---

### पहली बार Login के बाद

अगर आपको **"Please change your password"** दिखे, तो:
1. नया password डालें (कम से कम 8 अक्षर)
2. Confirm password में वही password दोबारा डालें
3. **Change Password** button दबाएं

---

### Default Admin Login (पहली बार)

```
Email:    admin@school.com
Password: admin123
```

> ⚠️ पहले Login के बाद तुरंत password बदलें।

---

## 3. Admin Guide

Admin को सबसे ज़्यादा access मिलता है। Admin सब कुछ देख और बदल सकता है।

---

### 3.1 Dashboard

Dashboard पर login करते ही दिखता है:

| जानकारी | मतलब |
|---|---|
| Total Students | स्कूल में कुल छात्र |
| Total Teachers | कुल शिक्षक |
| Fee Collected | इस साल कुल जमा फीस |
| Today Present | आज उपस्थित छात्र |
| Today Absent | आज अनुपस्थित छात्र |
| Attendance % | उपस्थिति का प्रतिशत |

नीचे **Recent Notices** — स्कूल की ताज़ा सूचनाएं दिखती हैं।

---

### 3.2 Students — छात्र प्रबंधन

**Menu में जाएं → Students**

#### नया छात्र जोड़ना

1. **Add Student** button दबाएं
2. यह जानकारी भरें:

| Field | क्या भरें |
|---|---|
| Full Name | छात्र का पूरा नाम |
| Date of Birth | जन्म तारीख |
| Gender | Male / Female / Other |
| Class | कक्षा (जैसे 10) |
| Section | सेक्शन (जैसे A) |
| Roll Number | Roll No. |
| Phone | छात्र का फोन (optional) |
| Parent Name | माता/पिता का नाम |
| **Parent Phone** | ⭐ WhatsApp नंबर (यह ज़रूरी है — इसी पर messages आएंगे) |
| Parent Email | माता/पिता की email |
| Address | पता |
| Admission Date | दाखिले की तारीख |
| Photo | छात्र की फोटो (JPG/PNG) |

3. **Save** button दबाएं

> ✅ छात्र जोड़ते ही automatically:
> - **छात्र का login account** बन जाएगा
> - **Parent का login account** बन जाएगा
> - दोनों के credentials (email + password) एक बार दिखेंगे — **इन्हें नोट कर लें**

---

#### छात्र की जानकारी देखना / बदलना

1. Students list में छात्र को ढूंढें
2. Search bar में नाम या ID लिखकर खोजें
3. **Edit** (✏️) button दबाएं
4. जानकारी बदलें और **Save** करें

---

#### Student ID Card डाउनलोड करना

1. Students list में छात्र के सामने **ID Card** button दबाएं
2. PDF automatic download हो जाएगी
3. Print करके छात्र को दें

ID Card में होता है:
- छात्र की फोटो
- नाम, कक्षा, Roll No.
- Student ID (जैसे STU0001)
- Academic Year
- Parent का नाम और नंबर
- स्कूल का नाम

---

#### छात्र को Inactive / Transfer करना

1. छात्र के **Edit** में जाएं
2. **Status** बदलें: `inactive` या `transferred`
3. Save करें

---

### 3.3 Teachers — शिक्षक प्रबंधन

**Menu में जाएं → Teachers**

#### नया शिक्षक जोड़ना

1. **Add Teacher** button दबाएं
2. यह जानकारी भरें:

| Field | क्या भरें |
|---|---|
| Full Name | शिक्षक का नाम |
| Email | Email address (login के लिए) |
| Phone | WhatsApp नंबर |
| Qualification | योग्यता (जैसे B.Ed) |
| Experience | अनुभव (साल में) |
| Subjects | पढ़ाए जाने वाले विषय |
| Assigned Classes | कौन सी class/section पढ़ाते हैं |
| Salary | वेतन |
| Join Date | नियुक्ति तारीख |
| Photo | फोटो |

3. **Save** करें
4. Teacher का login account बन जाएगा — credentials नोट करें

---

### 3.4 Attendance — उपस्थिति

**Menu में जाएं → Attendance**

#### आज की हाजिरी लगाना

1. **Class** और **Section** चुनें
2. **Date** चुनें (आज की तारीख)
3. हर छात्र के सामने status चुनें:
   - ✅ **Present** — उपस्थित
   - ❌ **Absent** — अनुपस्थित
   - 🕐 **Late** — देर से आया
   - 🏖️ **Holiday** — छुट्टी
4. **Save Attendance** button दबाएं

> 📱 जिस छात्र को **Absent** लगाया जाएगा, उसके parent को automatically WhatsApp message जाएगा।

---

#### पुरानी Attendance देखना

1. Class, Section चुनें
2. Date range चुनें
3. **View** button दबाएं

---

### 3.5 Fees — फीस प्रबंधन

**Menu में जाएं → Fees**

#### नई फीस एंट्री बनाना

1. **Add Fee** button दबाएं
2. भरें:

| Field | क्या भरें |
|---|---|
| Student | छात्र का नाम खोजें और चुनें |
| Fee Type | Tuition / Transport / Library / Sports / Exam / Other |
| Amount | फीस की रकम (₹ में) |
| Due Date | जमा करने की अंतिम तारीख |
| Month | किस महीने की फीस है |
| Year | कौन सा साल |
| Remarks | कोई नोट (optional) |

3. **Save** करें

---

#### फीस Payment दर्ज करना (जब छात्र पैसे जमा करे)

1. उस छात्र की fee entry ढूंढें
2. **Pay** button दबाएं
3. भरें:
   - **Paid Amount** — कितने पैसे जमा हुए
   - **Payment Method** — Cash / Bank Transfer / Online / Cheque
4. **Confirm Payment** दबाएं

> ✅ Payment के बाद:
> - Status बदलकर **PAID** हो जाएगी
> - Parent को automatically WhatsApp receipt message जाएगा

---

#### Fee Receipt PDF डाउनलोड करना

1. Fee entry के सामने **Receipt** (📄) button दबाएं
2. PDF download होगी
3. Print करके parent को दें

Receipt में होता है:
- Receipt Number (RCP000001)
- छात्र का नाम, कक्षा
- फीस प्रकार, रकम, payment method
- Payment की तारीख
- Total Paid amount

---

#### बकाया फीस देखना

- **Status filter** में **Unpaid** या **Partial** चुनें
- सभी बकाया fees की list आ जाएगी

---

### 3.6 Results — परिणाम

**Menu में जाएं → Results**

#### नया Result जोड़ना

1. **Add Result** button दबाएं
2. भरें:

| Field | क्या भरें |
|---|---|
| Student | छात्र चुनें |
| Exam Type | Unit Test / Midterm / Final / Quarterly |
| Academic Year | जैसे 2025-2026 |
| Class & Section | कक्षा |
| Subjects | हर विषय के नंबर |

3. हर Subject के लिए:
   - Subject Name (जैसे Mathematics)
   - Max Marks (पूर्णांक)
   - Obtained Marks (प्राप्तांक)

4. **Save** करें

> 🧮 Grade automatic calculate होगी:
> - A+ = 90% से ऊपर
> - A = 80-89%
> - B+ = 70-79%
> - B = 60-69%
> - C = 50-59%
> - D = 33-49%
> - F = 33% से नीचे

---

### 3.7 Notices — सूचनाएं

**Menu में जाएं → Notices**

#### नई Notice बनाना

1. **Add Notice** button दबाएं
2. भरें:

| Field | क्या भरें |
|---|---|
| Title | सूचना का शीर्षक |
| Content | पूरी सूचना |
| Type | General / Exam / Holiday / Event / Fee / Result |
| Target Audience | All / Teachers / Students / Parents |
| Pin | Important notice को ऊपर रखना हो तो ✅ |
| Expiry Date | कब तक दिखानी है (optional) |
| Send WhatsApp | ✅ करें तो सभी को WhatsApp पर भी जाएगी |

3. **Save** करें

---

### 3.8 Timetable — समय-सारणी

**Menu में जाएं → Timetable**

#### Class का Timetable बनाना

1. **Class** और **Section** चुनें
2. **Edit** button दबाएं
3. जिस दिन (Monday-Saturday) का टाइमटेबल बनाना है उसे चुनें
4. **Add Period** button से periods जोड़ें:

| Field | क्या भरें |
|---|---|
| Period No | 1, 2, 3... |
| Start Time | शुरू का समय (जैसे 08:00) |
| End Time | खत्म का समय (जैसे 08:45) |
| Subject | विषय का नाम |
| Teacher | शिक्षक चुनें (dropdown से) |

5. **Save Day** button दबाएं
6. एक-एक दिन करके पूरे हफ्ते का टाइमटेबल बनाएं

---

### 3.9 Exam Schedule — परीक्षा कार्यक्रम

**Menu में जाएं → Exam Schedule**

#### नई Exam जोड़ना

1. **Add Exam** button दबाएं
2. भरें:

| Field | क्या भरें |
|---|---|
| Exam Type | Unit Test / Midterm / Final / Quarterly / Other |
| Academic Year | जैसे 2025-2026 |
| Class | कक्षा नंबर |
| Section | Section (या "All" सभी sections के लिए) |
| Subject | विषय |
| Exam Date | परीक्षा की तारीख |
| Start Time | शुरू का समय |
| Duration | कितने मिनट (जैसे 180 = 3 घंटे) |
| Max Marks | पूर्णांक |
| Room | कमरा नंबर |
| Notes | कोई विशेष सूचना |

3. **Save** करें

---

#### Manual Reminder भेजना

किसी exam के सामने **Send Reminder** button दबाएं:
- उस class के सभी parents/students को WhatsApp message जाएगा
- Message में परीक्षा का subject, date, time, room सब होगा

> 🕐 Automatic: हर दिन सुबह 8 बजे, अगले दिन की परीक्षा का reminder automatic WhatsApp पर जाता है।

---

### 3.10 WhatsApp Setup

**Menu में जाएं → WhatsApp Setup**

यह सबसे पहले करना ज़रूरी है — इसके बिना कोई WhatsApp message नहीं जाएगा।

#### WhatsApp Connect करना (पहली बार)

**Step 1:** **Connect WhatsApp** button दबाएं

**Step 2:** थोड़ी देर रुकें (10-15 seconds) — QR Code दिखेगा

**Step 3:** अपने phone में WhatsApp खोलें
- Top-right में तीन dots (⋮) → **Linked Devices**
- **Link a Device** button दबाएं
- Camera से screen पर दिखा QR Code scan करें

**Step 4:** Status बदलकर **Connected ✓** हो जाएगा

> ✅ एक बार connect होने के बाद session save हो जाता है।  
> Server restart होने पर दोबारा scan नहीं करना पड़ता।

---

#### Test Message भेजना

1. **Test Message** section में phone number डालें
2. Message लिखें
3. **Send WhatsApp** button दबाएं

---

#### Broadcast — सभी को एक साथ Message

1. **Broadcast Message** section में message लिखें
2. किसे भेजना है चुनें:
   - ✅ Parents
   - ✅ Teachers
   - ✅ Students
3. **Send Broadcast** button दबाएं

Message queue में जाएगा और automatically deliver होगा।

---

#### Queue Status देखना

- **Pending:** अभी भेजा जाना बाकी है
- **Sent:** भेजा जा चुका है
- **Failed:** नहीं भेजा जा सका

अगर **Failed** messages हों, **Retry Failed** button दबाएं।

---

### 3.11 Gallery — गैलरी

**Menu में जाएं → Gallery**

1. **Upload Photo** button दबाएं
2. Event का नाम और फोटो चुनें
3. **Upload** करें

Photos स्कूल की public gallery पर दिखती हैं।

---

## 4. Teacher Guide

Teacher को **अपनी assigned class** की जानकारी मिलती है।

### Login के बाद Teacher को क्या दिखेगा

- अपनी class के छात्रों की list
- अपनी class का timetable
- अपनी class की exams

---

### Attendance लगाना (Teacher)

**Menu → Attendance**

1. अपनी **Class** और **Section** चुनें (जो admin ने assign की है)
2. Date चुनें
3. हर छात्र को Present / Absent / Late mark करें
4. **Save Attendance** दबाएं

---

### Result डालना (Teacher)

**Menu → Results**

1. **Add Result** button दबाएं
2. छात्र चुनें (अपनी class का)
3. Exam type और subjects के marks भरें
4. **Save** करें

---

### Timetable देखना (Teacher)

**Menu → Timetable**

- Class और Section चुनें
- पूरे हफ्ते का schedule दिखेगा
- Teacher यह सिर्फ देख सकता है, बदल नहीं सकता

---

### Exam Schedule देखना (Teacher)

**Menu → Exam Schedule**

- अपनी class की आने वाली परीक्षाओं की list दिखेगी
- Teacher केवल देख सकता है

---

## 5. Student Guide

Student केवल **अपनी जानकारी** देख सकता है।

### Student का Login

- Email: Student का email (Admin ने बताया होगा)
- Password: Admin ने पहली बार जो दिया वो (बाद में बदलें)

---

### Dashboard

Login के बाद dashboard पर दिखेगा:
- आज उपस्थित हैं या नहीं
- Upcoming exams
- Recent notices

---

### Attendance देखना

**Menu → Attendance**

- अपनी उपस्थिति का पूरा record दिखेगा
- Date-wise present / absent / late दिखेगा
- Total attendance percentage भी दिखेगी

---

### Fees देखना

**Menu → Fees**

- अपनी सभी fees की list दिखेगी
- Paid / Unpaid / Partial status दिखेगा
- Due date दिखेगी

> ⚠️ Student केवल fees देख सकता है, payment नहीं कर सकता। Payment Admin करता है।

---

### Results देखना

**Menu → Results**

- अपने सभी exam results दिखेंगे
- हर subject के marks और grade
- Total percentage और overall grade
- किस exam type का result है (Unit Test / Midterm / Final)

---

### Timetable देखना

**Menu → Timetable**

- अपनी class का पूरे हफ्ते का schedule
- **आज का दिन** highlight होगा (आसानी से पहचानें)
- हर period में subject और teacher का नाम

---

### Exam Schedule देखना

**Menu → Exams**

- Upcoming exams — जो आने वाली हैं
- हर exam पर countdown दिखेगा: "In 3 days", "Tomorrow!", "Today!"
- Past exams भी देख सकते हैं
- Subject, date, time, duration, max marks, room — सब दिखेगा

---

## 6. Parent Guide

Parent अपने **बच्चे की जानकारी** देख सकता है।

### Parent का Login

- Email: Parent का email (Admin ने बताया होगा जब student add किया था)
- Password: Admin ने पहली बार जो दिया वो

---

### Dashboard

- बच्चे का नाम और class दिखेगी
- Recent attendance
- Fee status
- Upcoming exams

---

### Timetable देखना

**Menu → Timetable**

- बच्चे की class का weekly timetable
- आज का दिन highlight होगा
- हर period की timing और subject

---

### Exam Schedule देखना

**Menu → Exams**

- बच्चे की class की सभी upcoming exams
- Countdown: "कल है!", "3 दिन बाद"
- Subject, date, time, room, max marks
- Notes (अगर कोई special instruction है)

---

### WhatsApp Notifications (Parents के लिए)

अगर आपका WhatsApp number student record में सही डला है, तो आपको automatic messages आएंगे:

| कब | क्या message आएगा |
|---|---|
| बच्चा Absent हो | "आपका बच्चा आज absent है" |
| फीस जमा हो | Receipt का message — amount, method, receipt no. |
| परीक्षा अगले दिन हो | परीक्षा का subject, time, room |
| School notice हो | Notice का content |

> 📱 WhatsApp number: जो Admin ने Student record में "Parent Phone" में डाला है, उसी पर messages आएंगे।

---

## 7. Password बदलना

किसी भी role का User अपना password बदल सकता है।

### Steps

1. Top-right में अपने नाम पर click करें → **Change Password**
   
   या browser में खोलें: `/change-password.html`

2. भरें:
   - **Current Password:** पुराना password
   - **New Password:** नया password (कम से कम 8 अक्षर)
   - **Confirm New Password:** नया password दोबारा

3. **Update Password** button दबाएं

> ✅ Password बदलने के बाद दोबारा login करना होगा।

---

### Admin Recovery (Admin का Password भूल जाएं)

अगर Admin का password भूल जाए:

1. Browser में खोलें: `/login.html`
2. नीचे **"Forgot Admin Password?"** link पर click करें
3. **Recovery Secret** डालें (यह `.env` file में `ADMIN_RECOVERY_SECRET` है)
4. Temporary password मिलेगा
5. उस password से login करें और तुरंत बदलें

---

## 8. WhatsApp Notifications

### कौन से Events पर Notifications जाते हैं?

#### 1. Attendance — अनुपस्थिति की सूचना
- **किसे:** Parent के WhatsApp पर
- **कब:** जब Teacher/Admin छात्र को Absent mark करे
- **Message उदाहरण:**
  ```
  Dear Parent, आपका बच्चा Rahul Kumar (Class 10-A)
  आज दिनांक 26-May-2026 को school नहीं आया।
  — Bright Future School
  ```

#### 2. Fee Payment — फीस रसीद
- **किसे:** Parent के WhatsApp पर
- **कब:** Admin fee payment mark करे
- **Message उदाहरण:**
  ```
  ✅ Fee Receipt — RCP000001
  
  Student: Rahul Kumar (10-A)
  Fee Type: Tuition
  Paid: Rs.5,000
  Method: CASH
  Status: PAID
  
  Thank you! — Bright Future School
  ```

#### 3. Exam Reminder — परीक्षा की याद
- **किसे:** Parent/Student के WhatsApp पर
- **कब:** परीक्षा से 1 दिन पहले सुबह 8 बजे (automatic)
- **Message उदाहरण:**
  ```
  📚 Exam Reminder — Class 10
  
  Subject: Mathematics
  Date: 27-May-2026
  Time: 10:00 AM
  Duration: 3 hours
  Max Marks: 100
  Room: Hall 1
  
  — Bright Future School
  ```

#### 4. Notice Broadcast — स्कूल सूचना
- **किसे:** Admin जो चुने (Parents / Teachers / Students / All)
- **कब:** Admin notice create करते समय "Send WhatsApp" checkbox ✅ करे

---

### WhatsApp काम न करे तो क्या करें?

1. **Admin → WhatsApp Setup** page खोलें
2. Status देखें:
   - **Connected ✓** → सब ठीक है
   - **Not Connected** → "Connect WhatsApp" button दबाएं और QR scan करें
   - **Error** → "Connect WhatsApp" दोबारा दबाएं

3. अगर QR Code न दिखे:
   - Page Refresh करें (F5)
   - 15 seconds रुकें
   - दोबारा try करें

4. Queue में Failed messages हों:
   - **Retry Failed** button दबाएं

---

## 9. सामान्य समस्याएं और समाधान

### ❌ Login नहीं हो रहा

**कारण और समाधान:**

| समस्या | समाधान |
|---|---|
| Email गलत है | Admin से सही email पूछें |
| Password गलत है | Admin से password reset करवाएं |
| Account inactive है | Admin से account activate करवाएं |
| Browser cache issue | Incognito/Private mode में try करें |

---

### ❌ WhatsApp Messages नहीं आ रहे (Parent को)

1. Admin को बताएं कि Student record में सही WhatsApp number डला हो
2. Number format: सिर्फ 10 अंक, जैसे `9876543210`
3. देश का code (91) नहीं डालना — सिस्टम खुद लगाता है
4. Admin → WhatsApp Setup → Status "Connected ✓" होना चाहिए

---

### ❌ Fee Receipt या ID Card Download नहीं हो रही

1. Browser में popup blocker बंद करें
2. या Browser Settings → Allow popups for this site
3. दोबारा try करें

---

### ❌ Timetable नहीं दिख रहा

- Admin ने उस class का timetable बनाया होगा तभी दिखेगा
- Admin से timetable बनवाएं (Admin → Timetable → उस class को select करें)

---

### ❌ Page खुल नहीं रहा / Error आ रहा है

1. Internet connection check करें
2. Server IP सही है या नहीं check करें
3. Browser cache clear करें (Ctrl + Shift + Delete)
4. Admin को बताएं

---

### ❌ Student को Fees / Results नहीं दिख रहे

- Admin ने वो records डाले हैं या नहीं, confirm करें
- Student सिर्फ अपना data देख सकता है, दूसरे का नहीं

---

### ❌ Password भूल गए

- Student / Teacher / Parent: Admin से नया password reset करवाएं
- Admin: Recovery Secret से reset करें (देखें: [Section 7](#7-password-बदलना))

---

## Quick Reference Card

### Admin के लिए रोज़ के काम

```
सुबह:
  ✅ Dashboard check करें — stats देखें
  ✅ Attendance → Class और Section चुनकर हाजिरी लगाएं

हफ्ते में:
  ✅ Fees → नई fee entries और payments record करें
  ✅ Notices → कोई नई notice हो तो post करें

महीने में:
  ✅ Results → परीक्षा के बाद marks डालें
  ✅ Fees → बकाया fees की list check करें
```

### WhatsApp के लिए ज़रूरी बातें

```
✅ Admin → WhatsApp Setup → "Connected ✓" होना चाहिए
✅ हर Student के record में Parent Phone ज़रूर डालें
✅ अगर WhatsApp disconnect हो जाए — QR दोबारा scan करें
✅ Failed messages → Retry Failed button दबाएं
```

---

## संपर्क और सहायता

किसी भी तकनीकी समस्या के लिए:

- **GitHub:** https://github.com/ckmine11/school-management-Dr
- **Documentation:** [DOCUMENTATION.md](DOCUMENTATION.md) देखें (English में पूरी technical जानकारी)

---

*यह गाइड Bright Future School Management System v1.0 के लिए बनाई गई है।*  
*Last Updated: May 2026*
