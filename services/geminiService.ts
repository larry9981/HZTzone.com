export const generateCustomTextIdeas = async (
  productName: string,
  occasion: string,
  recipient: string
): Promise<string[]> => {
  try {
    const response = await fetch("/api/gemini/generate-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productName, occasion, recipient }),
    });
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    const data = await response.json();
    return data.ideas || [
      "Together since " + new Date().getFullYear(),
      "Grobrav Fine Love",
      "You + Me Forever",
    ];
  } catch (error) {
    console.error("Error generating text ideas:", error);
    return ["Love Always", "Pure Connection", "Magic Moments"];
  }
};

export const generateDesignImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await fetch("/api/gemini/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    const data = await response.json();
    return data.image || null;
  } catch (error) {
    console.error("Error generating design image:", error);
    return null;
  }
};
