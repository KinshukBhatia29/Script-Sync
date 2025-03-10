from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import os
import base64
import re
import pandas as pd
import requests
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from difflib import get_close_matches
from sqlalchemy.exc import SQLAlchemyError
import uuid
from datetime import datetime
from flask_jwt_extended import unset_jwt_cookies
from flask_jwt_extended import unset_jwt_cookies, get_jwt_identity


API_KEY = "Your API key" #visionapikey

app = Flask(__name__)
app.config["SECRET_KEY"] = "my_super_secret_app_key"
app.config["JWT_SECRET_KEY"] = "my_super_secret_key"
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:@localhost/prescription"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
CORS(app, supports_credentials=True, expose_headers=["Authorization"])

df = pd.read_csv("medicine.csv")
df["First Word"] = df["Medicine Name"].apply(lambda x: x.split()[0].capitalize())

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

with app.app_context():
    db.create_all()

class Cart(db.Model):
    __tablename__ = "cart"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    added_at = db.Column(db.DateTime, default=db.func.current_timestamp())

with app.app_context():
    db.create_all()

class Inventory(db.Model):
    __tablename__ = "inventory"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(500), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    pieces = db.Column(db.Integer, nullable=False, default=100)

    def __init__(self, name, price, pieces=100):
        self.name = name
        self.price = price
        self.pieces = pieces

with app.app_context():
    db.create_all()

class Transaction(db.Model):
    __tablename__ = "transactions"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    transaction_id = db.Column(db.String(50), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow)
    total_balance = db.Column(db.Integer, nullable=False)

    user = db.relationship("User", backref="transactions", lazy=True)
    details = db.relationship("TransactionDetail", backref="transaction", lazy=True, cascade="all, delete-orphan")

    def __init__(self, user_id, total_balance, transaction_id=None):
        self.user_id = user_id
        self.total_balance = total_balance
        self.transaction_id = transaction_id if transaction_id else str(uuid.uuid4())  

class TransactionDetail(db.Model):
    __tablename__ = "transaction_details"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    transaction_id = db.Column(db.String(50), db.ForeignKey("transactions.transaction_id", ondelete="CASCADE"), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Integer, nullable=False)

    inventory = db.relationship("Inventory", backref="transaction_details")

    def __init__(self, transaction_id, inventory_id, quantity, price):
        self.transaction_id = transaction_id
        self.inventory_id = inventory_id
        self.quantity = quantity
        self.price = price

with app.app_context():
    db.create_all()

class Admin(db.Model):
    __tablename__ = "admin"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, password):
        """Hash the password before storing it in the database."""
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        """Check if the given password matches the stored hash."""
        return bcrypt.check_password_hash(self.password_hash, password)
    
with app.app_context():
    db.create_all()

@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 400

    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        # Convert user.id to string
        access_token = create_access_token(identity=str(user.id))
        app.logger.debug("Login successful for user: %s", user.username)
        return jsonify({"access_token": access_token, "username": user.username}), 200

    app.logger.error("Invalid login attempt for email: %s", email)
    return jsonify({"message": "Invalid credentials"}), 401

@app.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    current_user_id = get_jwt_identity()
    # Convert the string ID back to int for the DB lookup
    try:
        current_user_id = int(current_user_id)
    except ValueError:
        app.logger.error("JWT identity is not an integer: %s", current_user_id)
        return jsonify({"message": "Invalid token identity"}), 400

    app.logger.debug("Current user ID from token: %s", current_user_id)
    user = User.query.get(current_user_id)
    if not user:
        app.logger.error("User with ID %s not found", current_user_id)
        return jsonify({"message": "User not found"}), 404

    app.logger.debug("User %s found, returning dashboard message", user.username)
    return jsonify({"message": f"Welcome {user.username} to your dashboard!"}), 200

@app.route("/logout", methods=["GET"])
def logout():
    return jsonify({"message": "Logged out successfully"}), 200

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

def extract_text(image_path):
    url = f"https://vision.googleapis.com/v1/images:annotate?key={API_KEY}"
    image_content = encode_image(image_path)

    request_payload = {
        "requests": [
            {
                "image": {"content": image_content},
                "features": [{"type": "TEXT_DETECTION"}],
            }
        ]
    }

    response = requests.post(url, json=request_payload)
    app.logger.debug("Text detection API response status: %s", response.status_code)

    if response.status_code == 200:
        result = response.json()
        try:
            extracted_text = result["responses"][0]["textAnnotations"][0]["description"]
            return extracted_text.split("\n")
        except (KeyError, IndexError):
            app.logger.error("Error parsing text detection response")
            return []
    else:
        app.logger.error("Text detection API failed with status code: %s", response.status_code)
        return []

def filter_potential_medicine_names(extracted_text_list):
    filtered_list = []
    
    for word in extracted_text_list:
        word = word.strip()
        word = re.sub(r'[^a-zA-Z]', '', word)
        word = word.capitalize()

        if len(word) < 3:
            continue

        if word.upper() in ["TDS", "BD", "OD", "QID", "SOS", "HS", "STAT"]:
            continue

        filtered_list.append(word)

    return filtered_list

def correct_medicine_names(extracted_text_list, medicine_first_words, full_medicine_names):
    corrected_names = []
    
    vectorizer = TfidfVectorizer().fit(medicine_first_words)
    medicine_vectors = vectorizer.transform(medicine_first_words)

    for extracted_name in extracted_text_list:
        extracted_first_word = extracted_name.split()[0].capitalize()
        extracted_vector = vectorizer.transform([extracted_first_word])

        similarity_scores = cosine_similarity(extracted_vector, medicine_vectors)
        best_match_idx = similarity_scores.argmax()
        best_match_score = similarity_scores[0][best_match_idx]

        if best_match_score > 0.5:
            corrected_names.append(full_medicine_names[best_match_idx])
        else:
            closest_match = get_close_matches(extracted_first_word, medicine_first_words, n=1, cutoff=0.6)
            if closest_match:
                match_index = medicine_first_words.index(closest_match[0])
                corrected_names.append(full_medicine_names[match_index])
            else:
                corrected_names.append(extracted_name)

    return corrected_names

@app.route("/upload_prescription", methods=["POST"])
@jwt_required()
def upload_prescription():
    if "file" not in request.files:
        app.logger.error("No file uploaded in request")
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    image_path = "uploaded_prescription.jpg"
    file.save(image_path)
    app.logger.debug("File saved to %s", image_path)

    extracted_text_list = extract_text(image_path)
    app.logger.debug("Extracted text: %s", extracted_text_list)

    if extracted_text_list:
        cleaned_extracted_names = filter_potential_medicine_names(extracted_text_list)
        medicine_first_words = df["First Word"].tolist()
        full_medicine_names = df["Medicine Name"].tolist()
        corrected_names = correct_medicine_names(cleaned_extracted_names, medicine_first_words, full_medicine_names)

        return jsonify({"medicines": corrected_names})
    
    return jsonify({"medicines": []})

@app.route("/add_to_cart", methods=["POST"])
@jwt_required()
def add_to_cart():
    current_user_id = get_jwt_identity()
    try:
        current_user_id = int(current_user_id)
    except ValueError:
        return jsonify({"message": "Invalid user identity"}), 400

    data = request.get_json()
    medicine_name = data.get("medicine_name")

    # Find the medicine in the Inventory model
    inventory_item = Inventory.query.filter_by(name=medicine_name).first()

    if not inventory_item:
        return jsonify({"message": "Medicine not found in inventory"}), 404

    # Check if item is already in the cart
    existing_cart_item = Cart.query.filter_by(user_id=current_user_id, inventory_id=inventory_item.id).first()
    
    if existing_cart_item:
        existing_cart_item.quantity += 1
    else:
        new_cart_item = Cart(user_id=current_user_id, inventory_id=inventory_item.id, quantity=1)
        db.session.add(new_cart_item)

    db.session.commit()
    return jsonify({"message": f"{medicine_name} added to cart"}), 200

@app.route("/cart", methods=["GET"])
@jwt_required()
def get_cart():
    current_user_id = get_jwt_identity()
    
    try:
        current_user_id = int(current_user_id)
    except ValueError:
        return jsonify({"message": "Invalid user identity"}), 400

    cart_items = (
        db.session.query(Cart, Inventory)
        .join(Inventory, Cart.inventory_id == Inventory.id)
        .filter(Cart.user_id == current_user_id)
        .all()
    )

    cart_data = [
        {
            "id": cart_item.Cart.id,
            "medicine_name": cart_item.Inventory.name,
            "price": cart_item.Inventory.price,
            "quantity": cart_item.Cart.quantity,
            "total_price": cart_item.Cart.quantity * cart_item.Inventory.price
        }
        for cart_item in cart_items
    ]

    return jsonify({"cart_items": cart_data}), 200

@app.route("/update_cart_quantity", methods=["POST"])
@jwt_required()
def update_cart_quantity():
    current_user_id = get_jwt_identity()
    try:
        current_user_id = int(current_user_id)
    except ValueError:
        return jsonify({"message": "Invalid user identity"}), 400

    data = request.get_json()
    cart_id = data.get("cart_id")
    new_quantity = data.get("quantity")

    # Find the cart item
    cart_item = Cart.query.filter_by(id=cart_id, user_id=current_user_id).first()
    if not cart_item:
        return jsonify({"message": "Cart item not found"}), 404

    # Get the associated inventory item
    inventory_item = Inventory.query.get(cart_item.inventory_id)
    if not inventory_item:
        return jsonify({"message": "Inventory item not found"}), 404

    # Ensure quantity does not exceed available stock
    if new_quantity > inventory_item.pieces:
        return jsonify({"message": f"Cannot exceed available stock ({inventory_item.pieces} pieces)."}), 400

    # Update quantity
    cart_item.quantity = new_quantity
    db.session.commit()

    return jsonify({"message": "Cart updated successfully"}), 200

@app.route("/buy", methods=["POST"])
@jwt_required()
def buy_items():
    current_user_id = get_jwt_identity()

    try:
        current_user_id = int(current_user_id)
    except ValueError:
        return jsonify({"message": "Invalid user identity"}), 400

    # Fetch user's cart items along with inventory
    cart_items = (
        db.session.query(Cart, Inventory)
        .join(Inventory, Cart.inventory_id == Inventory.id)
        .filter(Cart.user_id == current_user_id)
        .all()
    )

    if not cart_items:
        return jsonify({"message": "Your cart is empty!"}), 400

    # Generate a unique transaction ID
    transaction_id = str(uuid.uuid4())

    # Calculate total balance for this transaction
    total_balance = sum(cart_item.Cart.quantity * cart_item.Inventory.price for cart_item in cart_items)

    try:
        # Create a new transaction record
        new_transaction = Transaction(user_id=current_user_id, total_balance=total_balance, transaction_id=transaction_id)
        db.session.add(new_transaction)

        # Insert transaction details & update inventory stock
        for cart_item in cart_items:
            inventory_item = cart_item.Inventory  # Reference to the inventory record

            # Check if stock is sufficient
            if cart_item.Cart.quantity > inventory_item.pieces:
                return jsonify({"message": f"Not enough stock for {inventory_item.name}. Available: {inventory_item.pieces}"}), 400

            # Insert transaction details
            new_detail = TransactionDetail(
                transaction_id=transaction_id,
                inventory_id=inventory_item.id,
                quantity=cart_item.Cart.quantity,
                price=inventory_item.price * cart_item.Cart.quantity
            )
            db.session.add(new_detail)

            # Deduct purchased quantity from inventory and update DB
            inventory_item.pieces -= cart_item.Cart.quantity
            db.session.add(inventory_item)

        # Clear the user's cart after purchase
        Cart.query.filter_by(user_id=current_user_id).delete()

        # Commit the transaction
        db.session.commit()

        return jsonify({"message": "Purchase successful!", "transaction_id": transaction_id, "total_balance": total_balance}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"message": "Transaction failed!", "error": str(e)}), 500


@app.route("/transactions", methods=["GET"])
@jwt_required()
def get_transactions():
    current_user_id = get_jwt_identity()
    
    try:
        current_user_id = int(current_user_id)
    except ValueError:
        return jsonify({"message": "Invalid user identity"}), 400

    # Fetch transactions with details
    transactions = (
        db.session.query(Transaction)
        .filter(Transaction.user_id == current_user_id)
        .order_by(Transaction.transaction_date.desc())
        .all()
    )

    transaction_data = []
    
    for transaction in transactions:
        transaction_details = (
            db.session.query(TransactionDetail, Inventory)
            .join(Inventory, TransactionDetail.inventory_id == Inventory.id)
            .filter(TransactionDetail.transaction_id == transaction.transaction_id)
            .all()
        )

        items = [
            {
                "medicine_name": detail.Inventory.name,
                "quantity": detail.TransactionDetail.quantity,
                "price": detail.TransactionDetail.price,
            }
            for detail in transaction_details
        ]

        transaction_data.append(
            {
                "transaction_id": transaction.transaction_id,
                "transaction_date": transaction.transaction_date.strftime("%Y-%m-%d %H:%M:%S"),
                "total_balance": transaction.total_balance,
                "items": items,
            }
        )

    return jsonify({"transactions": transaction_data}), 200

# Load the CSV file once when the app starts
df2 = pd.read_csv("medicine.csv")
df2["First_Word"] = df2["Medicine Name"].apply(lambda x: x.split()[0].capitalize())

@app.route("/search_medicine", methods=["GET"])
def search_medicine():
    query = request.args.get("query", "").strip().capitalize()  

    if not query:
        return jsonify({"message": "Please provide a search query"}), 400

    # Filter medicines by first word
    matched_medicines = df2[df2["First_Word"] == query]

    if matched_medicines.empty:
        return jsonify({"message": "No medicines found matching your query"}), 404

    # Convert result to JSON format
    results = matched_medicines.to_dict(orient="records")

    return jsonify({"medicines": results}), 200

@app.route("/admin_login", methods=["POST"])
def admin_login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    # Check if admin exists in the database
    admin = Admin.query.filter_by(email=email).first()
    if not admin or not admin.check_password(password):
        return jsonify({"message": "Invalid email or password"}), 401

    # Generate an access token for admin
    access_token = create_access_token(identity=str(admin.id))

    return jsonify({"message": "Login successful", "access_token": access_token}), 200

@app.route("/admin/transactions", methods=["GET"])
@jwt_required()
def get_all_transactions():
    """Admin fetches all transactions with user names and details."""
    
    current_user_id = get_jwt_identity()

    # Ensure that only an admin can access this route (assuming ID 1 is admin)
    admin = Admin.query.get(current_user_id)
    if not admin:
        return jsonify({"message": "Unauthorized access"}), 403

    transactions = (
        db.session.query(Transaction, User.username)
        .join(User, Transaction.user_id == User.id)
        .all()
    )

    transaction_data = []
    for transaction, username in transactions:
        transaction_data.append({
            "transaction_id": transaction.transaction_id,
            "username": username,
            "total_balance": transaction.total_balance,
            "transaction_date": transaction.transaction_date.strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify({"transactions": transaction_data}), 200


@app.route("/admin/transaction_details/<transaction_id>", methods=["GET"])
@jwt_required()
def get_transaction_details(transaction_id):
    """Admin fetches details of a specific transaction."""
    
    current_user_id = get_jwt_identity()

    # Ensure that only an admin can access this route
    admin = Admin.query.get(current_user_id)
    if not admin:
        return jsonify({"message": "Unauthorized access"}), 403

    details = (
        db.session.query(TransactionDetail, Inventory.name)
        .join(Inventory, TransactionDetail.inventory_id == Inventory.id)
        .filter(TransactionDetail.transaction_id == transaction_id)
        .all()
    )

    if not details:
        return jsonify({"message": "No details found for this transaction"}), 404

    details_data = []
    for detail, medicine_name in details:
        details_data.append({
            "medicine_name": medicine_name,
            "quantity": detail.quantity,
            "price_per_item": detail.price // detail.quantity,
            "total_price": detail.price
        })

    return jsonify({"transaction_details": details_data}), 200

@app.route("/admin/inventory", methods=["GET"])
@jwt_required()
def get_all_inventory():
    """Admin fetches medicines from inventory with pagination."""
    
    current_user_id = get_jwt_identity()

    # Ensure only an admin can access
    admin = Admin.query.get(current_user_id)
    if not admin:
        return jsonify({"message": "Unauthorized access"}), 403

    # Get page number (default to 1)
    page = request.args.get("page", 1, type=int)
    per_page = 50  # Number of medicines per page

    medicines = Inventory.query.paginate(page=page, per_page=per_page, error_out=False)

    medicine_data = [
        {
            "id": medicine.id,
            "name": medicine.name,
            "price": medicine.price,
            "pieces": medicine.pieces,
        }
        for medicine in medicines.items
    ]

    return jsonify({
        "medicines": medicine_data,
        "page": page,
        "total_pages": medicines.pages,
    }), 200


@app.route("/admin/update_inventory", methods=["POST"])
@jwt_required()
def update_inventory():
    """Admin updates medicine stock (pieces)."""
    
    current_user_id = get_jwt_identity()

    # Ensure that only an admin can access this route
    admin = Admin.query.get(current_user_id)
    if not admin:
        return jsonify({"message": "Unauthorized access"}), 403

    data = request.get_json()
    inventory_id = data.get("inventory_id")
    new_pieces = data.get("pieces")

    medicine = Inventory.query.get(inventory_id)
    if not medicine:
        return jsonify({"message": "Medicine not found"}), 404

    medicine.pieces = new_pieces
    db.session.commit()

    return jsonify({"message": f"Stock updated for {medicine.name}"}), 200

@app.route("/admin_logout", methods=["POST"])
@jwt_required()
def admin_logout():
    """Admin logout route - Clears JWT Token"""
    
    admin_id = get_jwt_identity()
    print("DEBUG: Admin ID from token:", admin_id)  # Debug statement

    # Check if the admin_id actually corresponds to an admin in the database
    admin_record = Admin.query.get(admin_id)
    if not admin_record:
        print("DEBUG: No Admin record found for admin_id:", admin_id)
        return jsonify({"message": "Unauthorized"}), 401

    # If valid admin, unset the cookies
    response = jsonify({"message": "Logged out successfully"})
    unset_jwt_cookies(response)
    return response, 200

@app.route("/admin/search_user", methods=["GET"])
@jwt_required()
def search_user():
    """Admin can search for a user by username or email and get transaction details."""
    query = request.args.get("query", "").strip()

    if not query:
        return jsonify({"message": "Please provide a search query."}), 400

    # Search user by username or email
    user = User.query.filter((User.username.ilike(f"%{query}%")) | (User.email.ilike(f"%{query}%"))).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    # Fetch transactions for the user
    transactions = (
        db.session.query(Transaction, TransactionDetail, Inventory)
        .join(TransactionDetail, Transaction.transaction_id == TransactionDetail.transaction_id)
        .join(Inventory, TransactionDetail.inventory_id == Inventory.id)
        .filter(Transaction.user_id == user.id)
        .all()
    )

    transaction_data = [
        {
            "id": detail.TransactionDetail.id,
            "medicine_name": detail.Inventory.name,
            "quantity": detail.TransactionDetail.quantity,
            "price": detail.TransactionDetail.price // detail.TransactionDetail.quantity,
            "total_price": detail.TransactionDetail.price,
        }
        for detail in transactions
    ]

    return jsonify({
        "user": {"username": user.username, "email": user.email},
        "transactions": transaction_data
    }), 200


if __name__ == "__main__":
    app.run(debug=True)
