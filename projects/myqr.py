import qrcode

# URL of your website
url = "https://suman-pokhrel.com.np"

# Generate QR code
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)
qr.add_data(url)
qr.make(fit=True)

# Create an image from the QR Code instance
img = qr.make_image(fill='black', back_color='white')

# Save the image file
img.save("suman_pokhrel_website_qr.png")

print("QR code generated and saved as suman_pokhrel_website_qr.png")