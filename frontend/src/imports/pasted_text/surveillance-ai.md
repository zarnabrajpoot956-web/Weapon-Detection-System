PROBLEM STATEMENT 
The problem statement should be concise, as you now understand it. It is highly advisable that it should not exceed more than 
5 lines. 
Traditional CCTV systems lack intelligent analysis and depend heavily on manual surveillance, 
resulting in delayed responses to abnormal or suspicious behaviors. This project addresses the 
limitations by implementing deep learning techniques for behavioural anomaly detection and 
classification in real-time video feeds. The system will automatically identify actions such as 
aggression, loitering, or panic, and notify security personnel for timely intervention. It aims to 
improve situational awareness, minimize human error, and enhance safety in diverse environments. 
  
EXECUTIVE SUMMARY 
This section summarizes the overall document and should include the important highlights from the document. It should 
be concise, professional and must stand alone. It is NOT an introduction, it is a summary. It is NOT an index or table 
of contents, it is a summary.  
The target audience for this section is a person who can appreciate the technology but is not well-versed in the details 
or in the project itself and who wants to read one page to understand an overview of the project.  
The one-page limit is a hard limit; you might well use less than a page.  
In order to stand alone, the Executive Summary should not make any reference to other parts of the document. 
      This project presents a smart surveillance solution focused on Behavioural Anomaly Detection 
and Classifications Using Deep Learning. By analyzing live CCTV feeds, the system identifies 
unusual human behaviors—such as aggression, theft, loitering, or panic—using object detection and 
activity recognition models. Real-time alerts and notifications are sent to security personnel, 
enabling immediate response and reducing dependency on manual monitoring. Designed for 
scalability and multi-location support, this system is suitable for public and private security 
applications. Core technologies include Python, OpenCV, YOLOv8, and real-time streaming 
frameworks, all integrated within a web/mobile-friendly dashboard. The project represents a modern, 
AI-driven approach to enhancing safety and response efficiency in surveillance systems. 
 
 
 
INTRODUCTION 
Relevance or importance of problem 
Background information to educate the reader 
Previous related work by others—literature review with credible sources  
       As public safety concerns rise, especially in urban environments, the need for smarter and more 
proactive surveillance solutions has become critical. Conventional CCTV systems primarily serve as passive 
recording tools, requiring manual observation to detect threats—an approach prone to fatigue and 
oversight. This project explores the use of deep learning to automatically detect and classify abnormal 
human behaviors in real-time video streams. Prior studies, such as those using convolutional neural 
networks (CNNs) and recurrent neural networks (RNNs), have demonstrated promising results in video
based action recognition. By building on this research, the project aims to deliver a robust, scalable, and 
cost-effective AI surveillance system for improved public safety.  
 
 
The University of Lahore – Final Project Proposal 
 
Page 3 
COMPETITORS/COMPETITIVE ANALYSIS  
This section will list down all the possible competitors of your product. That is, you need to list down all those 
products that are closely related to your product in terms of features, target audience, etc.  
 Hikvision Smart AI Surveillance: Advanced AI-powered video surveillance system 
offering facial recognition, intrusion detection, and behavior analysis for enterprise and public 
security. 
 Google Nest Cam with AI capabilities: Smart home security camera with AI features like 
person detection, activity zones, and real-time alerts integrated with Google ecosystem. 
 Ring Security Cameras: Consumer-focused smart security cameras with motion detection, 
real-time notifications, and cloud video storage, backed by Amazon. 
 Sighthound Video Surveillance: AI-driven video surveillance software offering real-time 
object detection, facial recognition, and automated alerting for businesses and developers. 
 
 
 
 
OBJECTIVES 
Objectives are the final results to be achieved after the completion of your project. 
 Develop a behaviourally intelligent surveillance system 
Utilize deep learning models to analyze real-time CCTV footage and detect abnormal 
human behaviours such as loitering, aggression, or panic. 
 Enable real-time anomaly classification 
Implement advanced classification techniques to differentiate between normal and 
suspicious activities for accurate and timely detection. 
 Automate alerts and response 
Integrate an alert system that pushes real-time notifications or alarms to responsible 
authorities for faster intervention. 
 Enhance security with minimal manual effort 
Reduce dependence on human operators by automating behavioral surveillance, 
increasing efficiency and reducing costs. 
MOTIVATION 
Why is your problem interesting and important?  
             With the rapid urbanization and rise in security threats, traditional surveillance methods are 
proving to be inadequate in identifying subtle yet potentially dangerous behaviors. Manual monitoring 
is resource-intensive, prone to human error, and lacks real-time responsiveness. This project is 
motivated by the need for a proactive security solution that can analyze behavioral patterns and detect 
anomalies automatically using deep learning. Such a system not only reduces operational burden but 
also significantly improves the likelihood of preventing incidents before escalation. By leveraging state
of-the-art AI tools, this project aligns with current trends in smart city development, offering both 
technological advancement and societal benefit. 
 
The University of Lahore – Final Project Proposal 
 
Page 4 
REQUIREMENTS  
Present the requirements as understood at this time through contacts with the stakeholder.   
 
 
Functional Requirements 
1. Integration with CCTV Camera Feeds 
o The system must connect to and stream live video from multiple CCTV 
cameras. 
2. Anomaly Detection Models (YOLOv8, Custom ML) 
o The system should utilize pre-trained models like YOLOv8 and custom-trained 
ML models to detect unusual activities (e.g., intrusion, loitering, sudden 
movements). 
3. Real-Time Notifications and Alarms 
o The system must generate real-time alerts (e.g., push notifications, email, or 
SMS) and trigger alarms when anomalies are detected. 
4. Admin Dashboard 
o Provide a secure, user-friendly web dashboard for administrators to monitor 
live feeds, view detected anomalies, manage cameras, and review logs. 
5. Database Storage for Logs/Events 
o All events, detections, and system logs should be stored in a secure database for 
review and auditing. 
6. User Authentication and Access Control 
o Only authorized users should be able to access the system, with role-based 
access for admins and viewers. 
Non-Functional Requirements 
1. Scalable Cloud or Local Deployment 
o The system should support deployment on both cloud platforms (e.g., AWS, 
GCP) and local servers, allowing for flexible scalability. 
2. Real-Time Performance 
o Detection and alerting must occur with minimal latency to enable timely 
intervention. 
3. System Reliability and Availability 
o The system should maintain high uptime and recover gracefully from failures 
or connectivity issues. 
4. Data Security and Privacy 
o Secure data transmission (e.g., HTTPS, encrypted streams), and compliance 
with privacy regulations for video data must be ensured. 
5. Modular and Maintainable Codebase 
o The architecture should be modular to allow for easy maintenance, updates, and 
integration of new AI models. 
6. Cross-Platform Accessibility 
The University of Lahore – Final Project Proposal 
 
Page 5 
o The admin dashboard should be accessible from desktop and mobile devices 
via a responsive web interface. 
7. Low Resource Footprint 
o Optimize models and processes to ensure the system runs efficiently even on 
limited hardware. 
 
 
 
FEATURES OF PROJECT 
Detailed functionality of each feature  
  Live CCTV Integration 
The system will support seamless integration with various CCTV camera models and 
standards. 
It will stream live video feeds continuously for real-time monitoring and analysis. 
This ensures that existing surveillance infrastructure can be easily leveraged without 
hardware changes. 
 
 AI-Powered Anomaly Detection 
Advanced computer vision models like YOLOv8 and custom-trained ML algorithms 
will analyze video feeds. 
The system will detect irregular activities such as loitering, intrusion, sudden crowding, 
or unauthorized access. 
These models will adapt to different environments and learn from data over time to 
improve accuracy. 
 
 Real-Time Notifications and Alarms 
The system will instantly notify security personnel via push notifications, SMS, or 
email when an anomaly is detected. 
It can also trigger physical alarms or sirens for immediate local response. 
This ensures swift action and minimizes delays in threat mitigation. 
 
 Admin Dashboard with Event Logs 
A centralized, web-based dashboard will allow authorized users to view live feeds and 
system status. 
It will also display historical event logs, anomaly reports, and detection analytics. 
Admins can configure alerts, manage cameras, and oversee system performance from a 
single interface. 
 
The University of Lahore – Final Project Proposal 
 Mobile and Web Interface 
The platform will be accessible on both desktop and mobile devices via a responsive, 
intuitive UI. 
Users can monitor live streams, receive alerts, and manage settings remotely from 
anywhere. 
This ensures flexibility and ease of use for both technical and non-technical users. 
 Scalability and Multi-Location Support 
The system will be designed to scale across multiple cameras and geographic locations. 
It will support both cloud-based and on-premise deployments to suit organizational 
needs. 
Centralized control and monitoring will enable efficient management of large-scale 
surveillance networks. 
ARCHITECTURAL DESIGN 
Describe hardware, software, or network components as relevant and as understood at this time.  Draw a high
level architecture diagram to illustrate the proposed system components and the relationships between them. 
Page 6 
The University of Lahore – Final Project Proposal 
 
Page 7 
IMPLEMENTATION TOOLS AND TECHNIQUES 
Describe your methodology for implementation along with implementation tools. 
Function Recommended Tool Why It's Suitable Alternatives 
Programming Python, JavaScript Python is ideal for AI/ML, while 
JavaScript supports 
frontend/dashboard development. 
Java, TypeScript 
Libraries TensorFlow, PyTorch, 
OpenCV, YOLOv8 
These libraries offer robust 
support for AI, vision tasks, and 
real-time detection. 
Keras, Scikit
learn, MediaPipe 
Development 
Tools 
VS Code, Postman, 
Firebase Console 
VS Code for coding, Postman for 
API testing, Firebase for 
backend/cloud functions. 
PyCharm, 
Insomnia, AWS 
Console 
Techniques Object Detection, 
Anomaly Detection, 
Real-time Streaming 
Core AI/ML methods for 
monitoring and detecting unusual 
events from CCTV feeds. 
Motion Detection, 
Action 
Recognition 
Deployment Docker, AWS, GCP Docker ensures portability; 
AWS/GCP provide scalable and 
reliable cloud hosting. 
Azure, Heroku, 
Kubernetes 
 
 
 
 
PROJECT PLAN 
This section describes how the project will be managed, including a detailed plan with milestones. Specific items 
to include in this section are as follows: 
 Division of responsibilities and duties among team members. 
 Timeline with milestones: Gantt chart in Microsoft project 2021. The following are required elements of 
your Gantt chart: 
o Project duration is from the date your project is enrolled to the completion date:  
o Each milestone is to be labeled with a title. 
o Schedule all tasks not just “Design” or “Testing.” Break this schedule down to specific 
assignments. 
o Each task is to be labeled with a title and person or persons assigned to the task. 
o Subdivide larger items so that no task is longer than about one week 
o Link tasks which are dependent on the completion of a previous task. 
 
Task Area Team Member(s) Description 
Requirement 
Gathering 
Umar, Zain, Zarnab Meeting stakeholders and gathering system 
requirements and constraints. 
UI/UX Design Zarnab Designing a clean, responsive dashboard 
and mobile-friendly interface. 
The University of Lahore – Final Project Proposal 
 
Page 8 
Frontend 
Development 
Zarnab Implementing dashboard UI, integrating 
with backend APIs. 
Backend 
Development 
Zain Setting up server logic, camera feed 
handling, and anomaly endpoints. 
Machine Learning 
Model 
Zain, Umar Training and integrating YOLOv8/anomaly 
detection models. 
CCTV Integration Umar Connecting real-time CCTV feeds to the 
backend pipeline. 
Testing & 
Debugging 
Umar, Zain, Zarnab Functional testing, AI performance 
validation, bug fixing. 
Documentation Umar, Zain, Zarnab Writing technical report, user manual, and 
API documentation. 
Deployment Zain,Umar Deploying the system to cloud/local server, 
setting up notifications. 
Presentation 
Preparation 
Umar, Zain, Zarnab Creating final slides, rehearsing demo, and 
preparing for the viva. 
1.1.1  
Gantt Chart Timeline 
Task Start Date End Date Milestone 
Requirement Gathering 2025-06-01 2025-06-28 User Needs Documented 
UI/UX Design 2025-06-29 2025-08-09 Final UI Design Ready 
Frontend Development 2025-08-10 2025-10-04 UI Developed 
Backend Development 2025-10-05 2025-11-15 APIs and DB Setup Completed 
Machine Learning Integration 2025-11-16 2025-12-13 Anomaly Detection Working 
CCTV Integration 2025-12-14 2026-01-10 Real-Time Feed Connected 
Testing & Debugging 2026-01-11 2026-03-07 Bug-free & Stable System 
Documentation 2026-03-08 2026-04-04 Report Finalized 
Deployment 2026-04-05 2026-04-25 System Live 
Presentation Preparation 2026-04-26 2026-05-09 Final Presentation Ready 
Final Submission & Viva 2026-05-10 2026-05-31 Project Completed 
 
    
VERSION CONTROL 
A table that will provide information of each time proposal was updated. 
Date Version Description Author 
10-05-2025 1.0 Initial Proposal Created All 
15-05-2025 1.2 Completed Executive Summary and Objectives All 
20-5-2025 1.3 Finalized Requirements, Architecture & Version Control All 
 
 
 
 
 
 
 
 
The University of Lahore – Final Project Proposal 
 
Page 9 
Checked & Approved/Not Approved By: 
Name:             _______________________________________________________________________ 
 
Signature:       _______________________________________________________________________             
REFERENCES 
Give references to the resources you have consulted in finalizing your project topic. 
 Kaggle CCTV Anomaly Dataset 
 HuggingFace Video Datasets 
 YOLOv8 Documentation 
 OpenCV Official Docs 
 Firebase Documentation 
 
 
……………………………….DO NOT WRITE BELOW THIS LINE………………………………… 
 
 
FOR OFFICE USE ONLY 
Approved   
 
 
 