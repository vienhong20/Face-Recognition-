const imageUpload = document.getElementById("imageUpload");

Promise.all([
  faceapi.nets.faceRecognitionNet.loadfromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadfromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadfromUri("/models")
]).then(start);

async function start() {
  const container = document.createElement("div");
  container.style.position = "relative";
  document.body.append(container);
  const LabeledFacceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.faceMatcher(LabeledFacceDescriptors, 0.6);
  document.body.append("Loaded");
  imageUpload.addEventListener("change", async () => {
    const image = await faceapi.bufferToImage(imageUpload.file[0]);
    container.append(image);
    const canvas = faceapi.createCanvasFromMedia(image);
    container.append(canvas);
    const displaySize = { width: image.width, height: image.height };
    faceapi.matchDimensions(canvas, displaySize);
    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map(d =>
      faceMatcher.findBestMatch(d.descriptor)
    );
    resizedDetections.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString()
      });
      drawBox.draw(canvas);
    });
  });
}
function loadLabeledImages() {
  const labels = [
    "Black Widow",
    "Captain America",
    "Captain Marvel",
    "Hawkeye",
    "Jim Rhodes",
    "Thor",
    "Tony Stark"
  ];
  return Promise.all(
    labels.map(async label => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(
          "https://github.com/vienhong20/Face-Recognition-/tree/master/labeled_images/${label}/${i}.jpg"
        );
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptors();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFacceDescriptors(label, descriptions);
    })
  );
}
