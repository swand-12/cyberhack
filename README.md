Registration System with Facial Recognition
This project is a Node.js-based registration system that allows users to register by providing their name and an image. If the name matches a prominent user listed in prominent_users.txt, the system performs facial recognition to check if the uploaded image matches the prominent user's image. If a match is found, registration is denied.

Features
User Registration:

Users can register by providing their name and uploading an image.

Prominent User Check:

The system checks if the provided name exists in the prominent_users.txt file.

Facial Recognition:

If the name matches a prominent user, the system uses face-api.js to compare the uploaded image with the corresponding image in the prominent_images folder.

Registration Denial:

If the facial recognition match is above a threshold (0.75), registration is denied.

Error Handling:

Proper error handling for missing inputs, no face detection, and file system errors.
