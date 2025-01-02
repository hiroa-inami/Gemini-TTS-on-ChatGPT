// ==UserScript==
// @name         Gemini TTS on ChatGPT
// @namespace    http://tampermonkey.net/
// @version      2025-01-01
// @description  try to take over the world!
// @author       hiroa
// @match        https://chatgpt.com/*
// @match        https://aistudio.google.com/prompts/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// ==/UserScript==

(async function() {
    'use strict';
    const messageKey = "geminiTTS_message"
    console.log("loaded: Gemini TTS on ChatGPT")

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const sentPrompts = new WeakSet();
    async function sendMessage() {
        let now = new Date();
        let formattedTime = now.toTimeString().split(' ')[0];// Extracts HH:mm:ss from the full time string
        let lastResponse = await getLastResponse();
        if (lastResponse.length < 3){return};
        let message = "Repeat after me as is. Don't add anything. Don't modify anything. From this pipe charactor |\n " + lastResponse
        try {
            await GM.setValue(messageKey, message);
            console.log("Message sent:", message);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    }
    async function getLastResponse() {
        const rerunButtons = document.querySelectorAll('button[name="rerun-button"]');
        if (rerunButtons.length === 0) { console.log("No rerun buttons found."); return;}

        const lastRerunButton = rerunButtons[rerunButtons.length - 1];
        if (sentPrompts.has(lastRerunButton)) return;

        const chatTurnElement = lastRerunButton.closest('ms-chat-turn.ng-star-inserted');
        if (!chatTurnElement) { console.log("no parent ms-chat-turn element."); return;}

        const spanElements = chatTurnElement.querySelectorAll('span.ng-star-inserted');
        if (spanElements.length === 0) {console.log("No span elements found"); return; }

        let mergedText = "";
        for (const spanElement of spanElements) {
            mergedText += spanElement.textContent;
        }

        sentPrompts.add(lastRerunButton);
        return mergedText
    }

    async function recieveMessage() {
        const message = await GM.getValue(messageKey);
        if (message) {
            console.log("Message received:", message);
            let cb_element = document.getElementById("prompt-textarea");
            if (cb_element) {
                cb_element.innerText = message
            }
            await sleep(1000);
            const path = document.querySelector('path[d="M15.1918 8.90615C15.6381 8.45983 16.3618 8.45983 16.8081 8.90615L21.9509 14.049C22.3972 14.4953 22.3972 15.2189 21.9509 15.6652C21.5046 16.1116 20.781 16.1116 20.3347 15.6652L17.1428 12.4734V22.2857C17.1428 22.9169 16.6311 23.4286 15.9999 23.4286C15.3688 23.4286 14.8571 22.9169 14.8571 22.2857V12.4734L11.6652 15.6652C11.2189 16.1116 10.4953 16.1116 10.049 15.6652C9.60265 15.2189 9.60265 14.4953 10.049 14.049L15.1918 8.90615Z"]');
            const button = path.closest("button");

            if (button) {
                button.click();
            } else {
                console.error('Button with aria-label "Send prompt" not found.');
            }

            await GM.deleteValue(messageKey);
        }
    }

    const currentDomain = window.location.hostname;
    if (currentDomain === "chatgpt.com") {
          setInterval(async () => {
              await recieveMessage();
          }, 1000);
    } else if (currentDomain === "aistudio.google.com") {
          setInterval(async () => {
              await sendMessage();
          }, 1000);
    }


})();
