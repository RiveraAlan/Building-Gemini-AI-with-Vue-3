import {useGenAi} from './useGenAi.js'

export const useGetGenerativeModelGP = async (prompt) => {

    const model = await useGenAi('gemini-1.5-flash');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
}