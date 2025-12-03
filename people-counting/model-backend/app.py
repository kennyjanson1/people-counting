from ultralytics import YOLO
import supervision as sv
import cv2
import collections 

model = YOLO("/Users/ravelsmac/Library/CloudStorage/OneDrive-BinaNusantara/The Semesters/Semester 5/Gender Detect/people-counting/model-backend/gender-cls.pt")
tracker = sv.ByteTrack()

# --- TRACKING DAN COUNTING ---
prediction_history = collections.defaultdict(lambda: collections.deque(maxlen=10)) 
counted_ids = set() 
gender_count = {"Male": 0, "Female": 0}
# Ambil 5 prediksi terakhir untuk konsensus
CONSENSUS_LENGTH = 5 
# Minimal 4 dari 5 prediksi harus sama
CONSENSUS_THRESHOLD = 4 

label_map = {0: "Female", 1: "Male"}
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame)[0]
    detections = sv.Detections.from_ultralytics(results)
    
    # Ambil confidence score dari detections sebelum tracking
    confidences = detections.confidence 
    
    tracked = tracker.update_with_detections(detections)
    
    # Dapatkan ID yang saat ini terdeteksi
    current_track_ids = set(tracked.tracker_id)
    
    # Bersihkan riwayat untuk ID yang hilang (PENTING untuk menjaga memori)
    keys_to_delete = [id for id in prediction_history if id not in current_track_ids and id not in counted_ids]
    for id in keys_to_delete:
        del prediction_history[id]

    # ZIP detections, confidences, dan tracked data untuk mendapatkan semua info
    for box, class_id, track_id, conf in zip(
            tracked.xyxy,
            tracked.class_id,
            tracked.tracker_id,
            confidences
        ):
        
        gender = label_map[class_id]
        
        # Format akurasi/confidence score (misal: 0.95)
        confidence_text = f"{conf:.2f}" 
        
        # 1. Simpan prediksi terbaru ke riwayat
        prediction_history[track_id].append(gender)

        # 2. Cek apakah track_id ini sudah dihitung
        if track_id not in counted_ids:
            
            # Logika Konsensus (tetap sama)
            if len(prediction_history[track_id]) >= CONSENSUS_LENGTH:
                history = list(prediction_history[track_id])
                gender_counts_in_history = collections.Counter(history)
                most_common_gender, count = gender_counts_in_history.most_common(1)[0]
                
                if count >= CONSENSUS_THRESHOLD:
                    # Konsensus tercapai
                    counted_ids.add(track_id)
                    gender_count[most_common_gender] += 1
                    print(f"NEW {most_common_gender} – ID {track_id} (Consensus Achieved)")

        # --- DRAWING BOUNDING BOX (MODIFIKASI) ---
        x1, y1, x2, y2 = map(int, box)
        
        # Teks baru: Gender (Akurasi)
        display_text = f"{gender} ({confidence_text})"
        
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
        cv2.putText(frame, display_text, (x1, y1-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)
        # ----------------------------------------

    cv2.putText(frame, f"Male: {gender_count['Male']}  Female: {gender_count['Female']}",
                (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)

    cv2.imshow("Counting", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()