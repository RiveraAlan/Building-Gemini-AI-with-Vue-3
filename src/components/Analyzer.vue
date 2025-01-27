<template>
    <div id="shopify-analyzer-demo">
        <!-- <p id="status" style="margin-top: 10px; font-weight: bold;">{{ status }}</p> -->
        <video id="shopify-video" class="screenrecording" controls style="width: 100%; max-width: 600px;"
            v-if="videoUrl">
            <source :src="videoUrl" type="video/webm" />
            Your browser does not support the video tag.
        </video>
        <div id="gemini-response" class="chat-container">
            <div class="chat-message ai-message">
                <p> Start a screen recording of your Shopify store, write an optional custom question, and click
                    "Analyze" to
                    review Gemini-generated recommendations interactively.</p>
            </div>
            <div v-for="(message, index) in messages" :key="index" class="chat-message" :class="message.type">
                <p v-html="message.content"></p>
            </div>
            <div v-if="parsedOptions.length" class="recommendations-container">
                <div v-for="(option, index) in parsedOptions" :key="index" class="recommendation-card">
                    <h3>{{ option.title }}</h3>
                    <p><strong>Description:</strong> {{ option.description }}</p>
                    <p><strong>Reason:</strong> {{ option.reason }}</p>
                    <p><strong>Example Layout:</strong> {{ option.layout }}</p>
                    <span class="arrow">→</span>
                </div>
            </div>
        </div>
        <div class="user-actions">
            <textarea v-model="customPrompt" placeholder="Write a specific question or focus area (optional)" rows="3"
                cols="40" style="margin-bottom: 10px; width: 100%;" class="textarea"></textarea>

            <button v-if="!isRecording && !videoUrl" class="btn" @click="startRecording">Start Recording</button>
            <button v-if="isRecording" class="btn" @click="stopRecording">Stop Recording</button>
            <button v-if="videoUrl && !isAnalyzing" class="btn" @click="fetchAnswer" :disabled="isAnalyzing">
                Analyze
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useGetGenerativeModelGPV } from "../composables/useGetGenerativeModelGPV.js";
import { marked } from "marked";

const status = ref("");
const videoUrl = ref(null);
const geminiResponse = ref("");
const rawGeminiResponse = ref(""); // Add this line to store raw response
const isRecording = ref(false);
const isAnalyzing = ref(false);
const recordedChunks = ref([]);
const mediaRecorder = ref(null);
const imgFiles = ref(null);
const customPrompt = ref(""); // Store the optional user-provided question
const showCustomPrompt = ref(true); // Show textarea for additional prompts
const combinedPrompt = ref(""); // Define combinedPrompt
const parsedOptions = ref([]); // Array to store the parsed options

const messages = ref([]); // Add this line to store chat history

const startRecording = async () => {
    try {
        status.value = "Starting screen recording...";
        messages.value.push({ type: 'ai-message', content: "Starting screen recording..." }); // Add AI status message
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: "screen" },
        });

        recordedChunks.value = [];
        mediaRecorder.value = new MediaRecorder(stream, { mimeType: "video/webm" });

        mediaRecorder.value.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.value.push(event.data);
            }
        };

        mediaRecorder.value.onstop = async () => {
            const blob = new Blob(recordedChunks.value, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            videoUrl.value = url;

            // Convert the video to a File object for Gemini
            imgFiles.value = [new File([blob], "screen-recording.webm", { type: "video/webm" })];

            status.value = "Screen recording completed. Ready to analyze.";
            messages.value.push({ type: 'ai-message', content: "Screen recording completed. Ready to analyze." }); // Add AI completion message
        };

        mediaRecorder.value.start();
        isRecording.value = true;
        status.value = "Recording in progress...";
        messages.value.push({ type: 'ai-message', content: "Recording in progress..." }); // Add AI recording message
    } catch (error) {
        console.error("Error starting screen recording:", error);
        status.value = "Failed to start screen recording.";
        messages.value.push({ type: 'ai-message', content: "Failed to start screen recording." }); // Add AI error message
    }
};

const stopRecording = () => {
    if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
        mediaRecorder.value.stop();
        isRecording.value = false;
        showCustomPrompt.value = true; // Allow custom prompt after recording
        status.value = "Processing recorded video...";
        messages.value.push({ type: 'ai-message', content: "Processing recorded video..." }); // Add AI processing message
    }
};

const fetchAnswer = async () => {
    if (!imgFiles.value) {
        status.value = "Please record your screen before analyzing.";
        messages.value.push({ type: 'ai-message', content: "Please record your screen before analyzing." }); // Add AI prompt
        return;
    }

    // Combine the base instructions with the custom user prompt
    const basePrompt = `
            You are an expert Shopify developer and CRO (Conversion Rate Optimization) specialist with experience in creating high-converting Shopify sections for multi-million-dollar stores. Your task is to analyze a provided Shopify website screenshot and recommend three highly impactful and tailored Shopify sections that will enhance the store's design, user experience, and conversion rates.

            Guidelines:
            1. Analysis Focus Areas:
                • Evaluate the overall store design, navigation, and aesthetic consistency.
                • Assess the homepage, product pages, and collection pages for opportunities to improve engagement and conversions.
                • Identify gaps or missing sections that could add value (e.g., better storytelling, social proof, product discovery, etc.).
                • Consider modern e-commerce trends and industry best practices.
            2. Recommendation Requirements:
                • Compliment what the website is doing well and highlight the quality of the product being sold before presenting recommendations.
                • Create 3 detailed recommendations for new Shopify sections that align with the store's brand and target audience.
                • For each section, provide a name, a detailed description, and an explanation of why it would improve the store.
                • Include an example of how the section could look or function (describe layout, design elements, and any dynamic or interactive features).
                • Write the 3 options in the following format to allow parsing with JavaScript and regex:
                Option 1: [Section Name] | [Short Description] | [Why It's Needed] | [Example Layout - Desktop & Mobile]
                Option 2: [Section Name] | [Short Description] | [Why It's Needed] | [Example Layout - Desktop & Mobile]
                Option 3: [Section Name] | [Short Description] | [Why It's Needed] | [Example Layout - Desktop & Mobile]
                • Prioritize ease of use and mobile responsiveness in your recommendations.
                • Ensure that the recommendations align with the target audience, store niche, and products.
            3. Tone and Expertise:
                • Write in a professional yet approachable tone, ensuring clarity for both technical and non-technical users.
                • Use Shopify-specific terminology where appropriate, and explain technical terms if necessary.
                • Highlight your expertise by providing actionable, well-reasoned suggestions based on industry standards.

            Example Output Structure:

            Website Analyzed: [Insert URL Here]
            Store Overview: [Provide a brief analysis of the store, e.g., its niche, current strengths, and weaknesses.]

            Option 1: [e.g., Interactive Product Showcase] | [Explain what this section is, its key components, and how it works.] | [Justify the recommendation by pointing out the current gap or problem it addresses and its potential impact.] | [Desktop: A carousel with zoomable product images, color variants displayed as swatches, and customer reviews below each image. Mobile: A swipeable slider with touch-friendly zoom functionality.]

            Option 2: [e.g., Customer Testimonial Carousel] | [Explain the section, its content, and its benefits.] | [Tie the recommendation to the store's need for social proof or building trust.] | [Desktop: A horizontal slider with images, customer names, and short reviews. Mobile: A stackable format with scrollable cards.]

            Option 3: [e.g., Trending Now/Product Discovery] | [Explain the section's function and features.] | [Explain how it improves user engagement or helps customers find products faster.] | [Desktop: A grid-style section showing 6 trending items based on sales or user interactions. Mobile: A scrollable grid with two columns for optimal use of screen space.]

            Output Notes:
            • If the website already includes one of the recommended sections, suggest enhancements instead of creating a duplicate.
            • Ensure that all recommendations are feasible within Shopify's theme capabilities and customizable for the merchant.
            • Tell the user to choose one of the 3 options provided to create the section code snippet. The user may only choose one option to implement.
            `;
    const question = customPrompt.value
        ? `${basePrompt} Additionally, focus on: ${customPrompt.value}`
        : basePrompt;
    combinedPrompt.value = question; // Update combinedPrompt
    messages.value.push({ type: 'user-message', content: customPrompt.value }); // Add user message
    customPrompt.value = ""; // Clear the text box

    try {
        isAnalyzing.value = true;
        status.value = "Analyzing video...";
        messages.value.push({ type: 'ai-message', content: "Analyzing video..." }); // Add AI analyzing message
        const response = await useGetGenerativeModelGPV(question, imgFiles.value);
        rawGeminiResponse.value = response; // Store raw response
        geminiResponse.value = marked(response);
        parseGeminiResponse(); // Parse using raw response
        messages.value.push({ type: 'ai-message', content: marked(response) }); // Add AI response
        messages.value.push({ type: 'ai-message', content: "Analysis complete!" }); // Add AI completion message
        showCustomPrompt.value = false; // Hide the custom prompt after analysis
    } catch (error) {
        console.error("Error during Gemini analysis:", error);
        status.value = "An error occurred during analysis. Please try again.";
        messages.value.push({ type: 'ai-message', content: "An error occurred during analysis. Please try again." }); // Add AI error message
    } finally {
        isAnalyzing.value = false;
    }
};

// Function to parse the geminiResponse
const parseGeminiResponse = () => {
    const optionsRegex = /Option\s+\d+:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*)/g;
    const options = [];
    let match;

    while ((match = optionsRegex.exec(rawGeminiResponse.value)) !== null) {
        options.push({
            title: match[1].trim(),
            description: match[2].trim(),
            reason: match[3].trim(),
            layout: match[4].trim(),
        });
    }

    if (options.length === 0) {
        console.warn("No options were parsed. Please check the Gemini response format.");
    }

    parsedOptions.value = options;
    geminiResponse.value = geminiResponse.value.replace(optionsRegex, "");
};
</script>

<style scoped>
#shopify-analyzer-demo {
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: left;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 4px 6px rgba(159, 244, 154, 0.5);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.3);
overflow-y: auto;
    max-height: 70vh;
    position: relative;
}

#shopify-analyzer-demo p,
#shopify-analyzer-demo h3 {
    color: white;
}

.screenrecording {
    margin: auto;
    border-radius: 10px;
  box-shadow: 0 0 8px #9ff49a, inset 0 0 8px #9ff49a;
}

.btn {
    width: 20%;
    padding: 10px;
    border: none;
    border-radius: 5px;
    text-transform: uppercase;
    box-shadow: 6px 6px #9ff49a;
    background-color: white;
    color: #2d2d2d;
    transition: transform 0.3s, box-shadow 0.3s;
}

.btn:hover {
    cursor: pointer;
    transform: translate(2px, 2px);
    box-shadow: 4px 4px #9ff49a;
}

.textarea {
    width: 80%;
    padding: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    font-size: 0.9em;
    transition: box-shadow 1s ease-in-out, background 1s ease-in-out;
}

.textarea:focus {
    outline: none;
    box-shadow: 0 0 8px #9ff49a, inset 0 0 8px #9ff49a;
    background: rgba(70, 70, 70, 0.7);
}

.user-actions {
    display: flex;
    flex-direction: row;
    gap: 10px;
    position: sticky;
    bottom: 0;
}

.chat-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
    padding: 15px;
    border-radius: 10px;
}

.chat-message {
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 10px;
}

.chat-message p {
    display: inline-block;
    overflow: hidden;
    animation: typewriter 3s steps(40, end) 1;
    animation-fill-mode: forwards;
    width: 100%;
}

.user-message {
    background-color: rgb(159, 244, 154, 0.5);
    align-self: flex-end;
    color: white;
    max-width: 80%;
    position: relative;
}

.user-message p {
    text-align: left;
    padding: 0 10px;
}

.chat-message.user-message::after {
    content: '';
    position: absolute;
    bottom: 10px;
    right: -10px;
    width: 0;
    height: 0;
    border-bottom: 10px solid transparent;
    border-left: 10px solid rgb(159, 244, 154, 0.5);
}

.ai-message {
    background: rgb(255, 255, 255);
    background: radial-gradient(circle, rgba(255, 255, 255, 0) 0%, rgba(159, 244, 154, 0.4) 100%);
    box-shadow: 0 0 8px #9ff49a, inset 0 0 8px #9ff49a;
    align-self: flex-start;
    color: white;
    max-width: 80%;
    position: relative;
}

.ai-message p {
    text-align: left;
    padding: 0 10px;
}

.recommendations-container {
    display: flex;
    gap: 20px;
    justify-content: space-between;
    margin-top: 20px;
    flex-wrap: wrap;
}

.recommendation-card {
    flex: 1 1 calc(33.333% - 20px);
    background-color: #2d2d2d;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    text-align: left;
    transition: box-shadow 1s ease-in-out;
    position: relative; /* Add position relative to position the arrow */
}

.recommendation-card:hover {
    cursor: pointer;
    box-shadow: 0 0 8px #9ff49a, inset 0 0 8px #9ff49a;
}

.recommendation-card:hover .arrow {
    color: #9ff49a;
}

.recommendation-card h3 {
    margin-bottom: 10px;
    color: #333;
}

.recommendation-card p {
    margin-bottom: 5px;
    color: #555;
}

.arrow {
    position: absolute;
    bottom: 10px;
    right: 10px;
    color: white;
    transition: color 1s ease-in-out;
    font-size: 20px;
}
</style>