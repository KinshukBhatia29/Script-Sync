# 📌 Medicine Management System

## 📝 Project Description  
The **Medicine Management System** is a **smart prescription processing and inventory management platform** designed for **pharmacies and healthcare providers**. It allows users to **upload handwritten prescriptions**, automatically extract medicine names using **OCR**, and generate a **ready-to-process cart**. The system also features **real-time inventory management, secure authentication, automated billing, and order processing**, ensuring a **faster, error-free, and more efficient** pharmacy workflow.  

---

## 🚀 Key Functionalities  

- **OCR-Based Prescription Processing** – Extracts medicine names from uploaded prescriptions.  
- **Automated Medicine Matching** – Corrects and validates medicine names against the inventory.  
- **Instant Cart Generation** – Automatically adds extracted medicines to a digital cart.  
- **Real-Time Inventory Updates** – Tracks stock levels and prevents shortages.  
- **Secure Authentication** – Uses JWT-based authentication for user and admin roles.  
- **Seamless Order Processing & Billing** – Enables checkout, invoicing, and transaction tracking.  
- **Admin Dashboard** – Allows pharmacy admins to manage inventory, transactions, and user orders.  

---

## 🛠️ Installation Guide  

Follow these steps to set up the project on your local system:  

### 🔹 Step 1: Install Required Software  
1. Download **XAMPP** from **[here](https://www.apachefriends.org/)** and install it.  
2. Download and install **Python 3.11.5** from **[here](https://www.python.org/downloads/release/python-3115/)**.  
3. **Uninstall all other versions of Python** to avoid conflicts.  

### 🔹 Step 2: Set Up MySQL Database  
4. Open **XAMPP Control Panel** and **start the first two services (Apache & MySQL)**. Ensure both are **green**.  
5. Open your browser and go to **[`http://localhost/phpmyadmin`](http://localhost/phpmyadmin)**.  
6. Create a **new database named `prescription`**.  
7. Click **Import** and upload the **`prescription.sql`** file from the project folder.  

### 🔹 Step 3: Set Up Backend (Flask API)  
8. Open **Command Prompt (cmd)**, navigate to the project folder, and run the following commands:  

    ```sh
    python -m venv venv
    venv\Scripts\Activate
    pip install -r requirements.txt
    ```

9. Start the Flask API by running:  

    ```sh
    set flask_app=app.py
    flask run
    ```

### 🔹 Step 4: Set Up Frontend (React Application)  
10. Navigate to the `frontend` folder and install dependencies:  

    ```sh
    npm install
    ```

11. After installation, start the frontend server:  

    ```sh
    npm run dev
    ```

12. Open **[`http://localhost:5173/`](http://localhost:5173/)** in your browser to access the application.  

---

## 📌 Tech Stack  
- **Frontend**: React.js, Tailwind CSS  
- **Backend**: Flask, SQLAlchemy, JWT Authentication  
- **Database**: MySQL (phpMyAdmin via XAMPP)  
- **OCR Processing**: Google Vision API  
- **Package Management**: pip, npm  

---

🚀 **Enjoy using the Medicine Management System!** 🚀
