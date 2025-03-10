import pandas as pd
import mysql.connector
import random

# Database connection
db_config = {
    'host': 'localhost',
    'user': 'root',  
    'password': '',  
    'database': 'prescription'  
}

# Read CSV file
csv_file = 'medicine.csv'  
df = pd.read_csv(csv_file)

# Connect to MySQL
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# Insert data into MySQL table
for index, row in df.iterrows():
    medicine_name = row['Medicine Name']
    price = random.randint(50, 1000)
    pieces = 100

    query = "INSERT INTO inventory (name, price, pieces) VALUES (%s, %s, %s)"
    values = (medicine_name, price, pieces)

    cursor.execute(query, values)

# Commit and close the connection
conn.commit()
cursor.close()
conn.close()

print("Data inserted successfully!")
