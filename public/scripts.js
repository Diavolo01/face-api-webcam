console.log(faceapi)

const run = async()=>{
    //loading the models is going to use await
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
    })
    const videoFeedEl = document.getElementById('video-feed')
    videoFeedEl.srcObject = stream
    //we need to load our models
    // pre-trained machine learning for our facial detection!
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
        faceapi.nets.ageGenderNet.loadFromUri('./models'),
        faceapi.nets.faceExpressionNet.loadFromUri('./models'),
    ])

    //make the canvas the same size and in the same location
    // as our video feed
    const canvas = document.getElementById('canvas')
    canvas.style.left = videoFeedEl.offsetLeft
    canvas.style.top = videoFeedEl.offsetTop
    canvas.height = videoFeedEl.height
    canvas.width = videoFeedEl.width

    /////OUR FACIAL RECOGNITION DATA
    // we KNOW who this is 
    const response = await fetch('http://localhost:5000/image-url')
    const data = await response.json()
    const imageUrls = data.imageUrls

    if (imageUrls.length>0) {
    const refFace = await faceapi.fetchImage(imageUrls[1])
    console.log('Reference image loaded', imageUrls[1])
    
    //we grab the reference image, and hand it to detectAllFaces method
    let refFaceAiData = await faceapi.detectAllFaces(refFace).withFaceLandmarks().withFaceDescriptors()
    let faceMatcher = new faceapi.FaceMatcher(refFaceAiData)

    // facial detection with points
    setInterval(async()=>{
        // get the video feed and hand it to detectAllFaces method
        let faceAIData = await faceapi.detectAllFaces(videoFeedEl).withFaceLandmarks().withFaceDescriptors().withAgeAndGender().withFaceExpressions()
        // console.log(faceAIData)
        // we have a ton of good facial detection data in faceAIData
        // faceAIData is an array, one element for each face

        // draw on our face/canvas
        //first, clear the canvas
        canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height)
        // draw our bounding box
        faceAIData = faceapi.resizeResults(faceAIData,videoFeedEl)
        faceapi.draw.drawDetections(canvas,faceAIData)
        faceapi.draw.drawFaceLandmarks(canvas,faceAIData)
        faceapi.draw.drawFaceExpressions(canvas,faceAIData)

        // ask AI to guess age and gender with confidence level
        faceAIData.forEach(face=>{
            const { age, gender, genderProbability, detection, descriptor } = face
            const genderText = `${gender} - ${Math.round(genderProbability*100)/100*100}`
            const ageText = `${Math.round(age)} years`
            const textField = new faceapi.draw.DrawTextField([genderText,ageText],face.detection.box.topRight)
            textField.draw(canvas)

            let label = faceMatcher.findBestMatch(descriptor).toString()
            // console.log(label)
            let options = {label: "Tae"}
            if(label.includes("unknown")){
                options = {label: "Unknown subject..."}
            }
            const drawBox = new faceapi.draw.DrawBox(detection.box, options)
            drawBox.draw(canvas)
        })
        

    },200)
    }
}

run()