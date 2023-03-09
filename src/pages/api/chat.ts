import {OpenAIStream, OpenAIStreamPayload} from "@/utils/OpenAIStream";

export const config = {
    runtime: "edge",
};

const handler = async (req: Request): Promise<Response> => {
        const { prompt, wordLimit, apiKey } = (await req.json()) as {
            prompt: string;
            wordLimit: number;
            apiKey: string;
        };

    console.log(prompt, wordLimit, apiKey)

        let temp: number = 1.5;
        let fp: number = 1.0;

        if (wordLimit <= 250) {
            temp = 1.7;
            fp = 2.0;
        } else if (250 < wordLimit && wordLimit <= 500) {
            temp = 1.5;
            fp = 1.2;
        } else if (500 < wordLimit && wordLimit <= 750) {
            temp = 1.1;
            fp = 0.6;
        } else if (750 < wordLimit && wordLimit <= 1000) {
            temp = 1.1;
            fp = 0.5;
        } else if (1000 < wordLimit) {
            temp = 1.0;
            fp = 0.4;
        }

        console.log(`temp: ${temp}, fp: ${fp}`);

        const payload: OpenAIStreamPayload = {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: `${prompt} with ${wordLimit} words`,
                },
            ],
            max_tokens: wordLimit,
            temperature: temp,
            top_p: 0.95,
            frequency_penalty: fp,
            presence_penalty: 0.0,
            stream: true,
            n: 1,
            api_key: apiKey,
        }

    const stream = await OpenAIStream(payload, apiKey);
    return new Response(stream);
};

export default handler;