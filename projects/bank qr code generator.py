import qrcode
import json

def generate_qr_code(data, filename="bank_info_qr.png"):
    """Generates a QR code for mobile banking information.

    Args:
        data (dict): A dictionary containing banking information.
        filename (str): The filename to save the QR code image.
    """

    try:
        # Convert the dictionary to a JSON string
        data_string = json.dumps(data)

        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,  # Adjust version for more data
            error_correction=qrcode.constants.ERROR_CORRECT_L, #Error correction level
            box_size=10,
            border=4,
        )

        qr.add_data(data_string)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        img.save(filename)

        print(f"QR code saved as {filename}")

    except Exception as e:
        print(f"Error generating QR code: {e}")
accno = input("Enter your account number: ")
name = input("Enter Account Holder Name: ")
bank = input("Enter Bank Name: ")
def get_bank_code(bank_name):
    """Fetches the bank code from a JSON file based on the bank name.

    Args:
        bank_name (str): The name of the bank.

    Returns:
        str: The bank code if found, otherwise None.
    """
    try:
        with open("bankCode.json", "r") as file:
            bank_codes = json.load(file)
            for bank in bank_codes:
                if bank.get("name") == bank_name:
                    return bank.get("code")
    except FileNotFoundError:
        print("bankCode.json file not found.")
    except json.JSONDecodeError:
        print("Error decoding JSON from bankCode.json.")
    except Exception as e:
        print(f"An error occurred: {e}")
    return None

if __name__ == "__main__":
    bank_data = {
        "accountNumber": accno,
        "accountName": name.title(),
        "bankCode": 'NMBBNPKA',
   
    }

    generate_qr_code(bank_data)

    # Example with more data (might require higher QR code version)
    # more_bank_data = {
    #     "accountNumber": "0000000000000",
    #     "accountName": "SUMAN POKHREL",
    #     "bankCode": "NMBBNPKA",
    #     "branch": "Kathmandu",
    #     "ifsc": "NMBB0000001", #Example IFSC code
    #     "upiId": "suman.pokhrel@bank", #Example UPI ID
    #     "mobileNumber":"9841000000" #Example Mobile Number
    # }
    # generate_qr_code(more_bank_data, "bank_info_qr_more_data.png")