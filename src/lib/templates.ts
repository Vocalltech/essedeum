export const LORE_TEMPLATES: Record<string, string> = {
  Character: `<h1>👤 Identity</h1>
<p><strong>Full Name:</strong> </p>
<p><strong>Age / Lifespan:</strong> </p>
<p><strong>Role in Story:</strong> </p>

<h2>👁️ Appearance</h2>
<ul>
  <li><strong>Physical Traits:</strong> </li>
  <li><strong>Clothing/Style:</strong> </li>
  <li><strong>Distinguishing Marks:</strong> </li>
</ul>

<h2>🧠 Psychology</h2>
<p><strong>Motivations:</strong> </p>
<p><strong>Flaws / Fears:</strong> </p>
<p><strong>Beliefs:</strong> </p>

<h2>📖 Backstory</h2>
<p><em>(Write the character's history here...)</em></p>`,

  Location: `<h1>📍 Geography</h1>
<p><strong>Region/Continent:</strong> </p>
<p><strong>Climate/Weather:</strong> </p>

<h2>🏘️ Demographics & Culture</h2>
<p><strong>Population:</strong> </p>
<p><strong>Primary Exports:</strong> </p>
<p><strong>Government/Ruler:</strong> </p>

<h2>🏰 Key Landmarks</h2>
<ul>
  <li><strong>Landmark 1:</strong> </li>
  <li><strong>Landmark 2:</strong> </li>
</ul>

<h2>📖 History</h2>
<p><em>(Write the location's history here...)</em></p>`,

  Item: `<h1>⚔️ Description</h1>
<p><strong>Item Name:</strong> </p>
<p><strong>Creator/Origin:</strong> </p>
<p><strong>Physical Appearance:</strong> </p>

<h2>✨ Properties</h2>
<p><strong>Magical/Technological Effects:</strong> </p>
<p><strong>Limitations/Drawbacks:</strong> </p>

<h2>📖 Lore & History</h2>
<p><em>(How was this item made? Who has wielded it?)</em></p>`,

  Faction: `<h1>🛡️ Organization</h1>
<p><strong>Faction Name:</strong> </p>
<p><strong>Leader(s):</strong> </p>
<p><strong>Headquarters:</strong> </p>

<h2>⚖️ Beliefs & Goals</h2>
<p><strong>Core Philosophy:</strong> </p>
<p><strong>Primary Objective:</strong> </p>

<h2>⚔️ Resources & Power</h2>
<ul>
  <li><strong>Military Strength:</strong> </li>
  <li><strong>Wealth/Influence:</strong> </li>
</ul>

<h2>📖 History</h2>
<p><em>(How was this faction founded? Who are their historical enemies?)</em></p>`,

  Concept: `<h1>📜 Definition</h1>
<p><strong>Concept/Rule Name:</strong> </p>
<p><strong>Summary:</strong> </p>

<h2>⚙️ Mechanics</h2>
<p><strong>How it works:</strong> </p>
<p><strong>Rules & Limitations:</strong> </p>
<p><strong>Exceptions:</strong> </p>

<h2>🌍 Cultural Impact</h2>
<p><em>(How does this concept affect the daily lives of people in your world?)</em></p>`,
};

export interface StoryTemplateBeat {
  title: string;
  synopsis: string;
}

export const STORY_TEMPLATES: Record<string, StoryTemplateBeat[]> = {
  "Save the Cat! (15 Beats)": [
    {
      title: "1. Opening Image",
      synopsis:
        "A visual that represents the hero's flawed world before the story begins.",
    },
    {
      title: "2. Theme Stated",
      synopsis:
        "A statement (usually spoken to the hero) that hints at what the hero's arc will be.",
    },
    {
      title: "3. Set-Up",
      synopsis:
        "Establish the hero's life, their flaws, and what they have to lose.",
    },
    {
      title: "4. Catalyst",
      synopsis: "The inciting incident that disrupts the hero's world.",
    },
    {
      title: "5. Debate",
      synopsis: "The hero doubts whether they can take on the challenge.",
    },
    {
      title: "6. Break Into Two",
      synopsis: "The hero makes a choice and leaves their comfort zone.",
    },
    {
      title: "7. B Story",
      synopsis:
        "A subplot is introduced (often the love story or a secondary relationship).",
    },
    {
      title: "8. Fun and Games",
      synopsis:
        "The core premise is explored. The hero tries to navigate the new world.",
    },
    {
      title: "9. Midpoint",
      synopsis: "A false victory or false defeat. The stakes are raised.",
    },
    {
      title: "10. Bad Guys Close In",
      synopsis:
        "Things start to go wrong. Internal and external forces attack the hero.",
    },
    {
      title: "11. All Is Lost",
      synopsis:
        "The lowest point. The hero loses everything, often a 'whiff of death'.",
    },
    {
      title: "12. Dark Night of the Soul",
      synopsis: "The hero reacts to the loss and realizes their flaw.",
    },
    {
      title: "13. Break Into Three",
      synopsis:
        "The hero finds the solution by combining what they learned with what they had.",
    },
    {
      title: "14. Finale",
      synopsis:
        "The hero confronts the antagonist and proves they have changed.",
    },
    {
      title: "15. Final Image",
      synopsis:
        "A visual that mirrors the Opening Image, showing how the hero has grown.",
    },
  ],
  "The Hero's Journey (12 Steps)": [
    {
      title: "1. The Ordinary World",
      synopsis: "Introduce the hero in their normal, safe environment.",
    },
    {
      title: "2. Call to Adventure",
      synopsis:
        "The hero is presented with a problem, challenge, or adventure.",
    },
    {
      title: "3. Refusal of the Call",
      synopsis: "The hero hesitates or refuses out of fear or reluctance.",
    },
    {
      title: "4. Meeting the Mentor",
      synopsis:
        "The hero meets someone who gives them guidance, training, or magical gifts.",
    },
    {
      title: "5. Crossing the Threshold",
      synopsis: "The hero commits to the journey and enters the Special World.",
    },
    {
      title: "6. Tests, Allies, Enemies",
      synopsis: "The hero faces trials, makes friends, and encounters foes.",
    },
    {
      title: "7. Approach to the Inmost Cave",
      synopsis: "The hero prepares for the central, most dangerous challenge.",
    },
    {
      title: "8. The Ordeal",
      synopsis:
        "The major crisis or life-and-death struggle where the hero confronts their greatest fear.",
    },
    {
      title: "9. Reward (Seizing the Sword)",
      synopsis: "The hero survives and gains a reward, knowledge, or power.",
    },
    {
      title: "10. The Road Back",
      synopsis:
        "The hero begins the journey back but must face the consequences of their actions.",
    },
    {
      title: "11. Resurrection",
      synopsis:
        "The final, most severe test. The hero is reborn and transformed.",
    },
    {
      title: "12. Return with the Elixir",
      synopsis:
        "The hero returns home changed, bringing something to benefit their world.",
    },
  ],
  "Three-Act Structure": [
    {
      title: "Act I: Setup",
      synopsis:
        "Introduce characters, setting, and the central conflict (Inciting Incident).",
    },
    {
      title: "Act I: Plot Point 1",
      synopsis:
        "The protagonist decides to engage with the conflict, moving into Act II.",
    },
    {
      title: "Act II: Rising Action",
      synopsis:
        "The protagonist tries to solve the problem but encounters worsening obstacles.",
    },
    {
      title: "Act II: Midpoint",
      synopsis:
        "A major revelation or twist that changes the protagonist's understanding of the conflict.",
    },
    {
      title: "Act II: Plot Point 2",
      synopsis:
        "The protagonist reaches their lowest point (All Is Lost) before finding the final solution.",
    },
    {
      title: "Act III: Climax",
      synopsis:
        "The final confrontation where the protagonist faces the antagonist or main obstacle.",
    },
    {
      title: "Act III: Resolution",
      synopsis:
        "The aftermath. Loose ends are tied up, and the new normal is established.",
    },
  ],
  "Romance Arc (9 Milestones)": [
    {
      title: "1. The Meet Cute",
      synopsis: "The characters meet in a memorable or distinctive way.",
    },
    {
      title: "2. The Hesitation",
      synopsis:
        "Reasons why they shouldn't or can't be together (internal or external).",
    },
    {
      title: "3. The Spark",
      synopsis:
        "A moment of connection where the attraction becomes undeniable.",
    },
    {
      title: "4. The Pull",
      synopsis:
        "They are drawn together and start building a relationship, despite their hesitations.",
    },
    {
      title: "5. The Complication",
      synopsis:
        "A major obstacle or misunderstanding arises to threaten the relationship.",
    },
    {
      title: "6. The Deepening",
      synopsis:
        "They overcome the complication and grow closer, sharing vulnerabilities.",
    },
    {
      title: "7. The Black Moment",
      synopsis:
        "The worst-case scenario happens. They break up or are torn apart.",
    },
    {
      title: "8. The Grand Gesture",
      synopsis:
        "One or both characters make a significant effort to prove their love.",
    },
    {
      title: "9. Happily Ever After",
      synopsis:
        "They are reunited, resolving their issues and committing to each other.",
    },
  ],
};
