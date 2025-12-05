from ultralytics import YOLO
import cv2
import matplotlib.pyplot as plt

face_model = YOLO("face-model.pt") # Face Detector
gender_model = YOLO("gender-cls.pt") # Gender Detector

label_map = {0: "Female", 1: "Male"} # Label

img = cv2.imread("4-people.jpg") # upload image to detect
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
h, w = img.shape[:2]

face_results = face_model(img_rgb)[0] # Detect face
output = img_rgb.copy()

for box in face_results.boxes:
    x1, y1, x2, y2 = map(int, box.xyxy[0])

    pad = 20
    x1p = max(0, x1 - pad)
    y1p = max(0, y1 - pad)
    x2p = min(w, x2 + pad)
    y2p = min(h, y2 + pad)

    face_crop = img_rgb[y1p:y2p, x1p:x2p]

    if face_crop.size == 0:
        continue

    face_crop = cv2.resize(face_crop, (416, 416))
    g_res = gender_model(face_crop)[0] # predict gender

    if len(g_res.boxes) == 0:
        gender_label = "Unknown"
        gender_conf = 0.00
    else:
        cls = int(g_res.boxes.cls[0])
        conf = float(g_res.boxes.conf[0])
        gender_label = label_map.get(cls, "Unknown")
        gender_conf = conf

    text = f"{gender_label} ({gender_conf:.2f})"

    cv2.rectangle(output, (x1, y1), (x2, y2), (0,255,0), 2)
    cv2.putText(output, text, (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,0,0), 2)

# Show final image
plt.figure(figsize=(10, 10))
plt.imshow(output)
plt.axis("off")
plt.show()
