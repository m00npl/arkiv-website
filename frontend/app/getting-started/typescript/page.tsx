"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Wallet } from "ethers";
import { CodePlayground } from "@/components/ui/CodePlayground";

import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

type Bullet = { t: string; v: string };

function T({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger className="underline decoration-dotted underline-offset-2 cursor-help">
        {term}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{children}</TooltipContent>
    </Tooltip>
  );
}

export default function GettingStartedPage() {
  // start on the first step (Generate, Fund & Hello)
  const [activeSection, setActiveSection] = useState("fund-hello");
  const [generated, setGenerated] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);
  const [copied, setCopied] = useState<"address" | "privateKey" | null>(null);

  const helloPlaygroundTs = (
    generatedPk?: string,
  ) => `// 🚀 HELLO WORLD ON ARKIV
// 1) Point at the Arkiv + provide your private key
//    – PRIVATE_KEY is auto-filled from the generator above when you click Run
//    – CHAIN_ID is hardcoded for the Arkiv
const CHAIN_ID = 60138453025;
const PRIVATE_KEY = '${generatedPk ?? "0xYOUR_PRIVATE_KEY"}';
const RPC_URL = 'https://kaolin.hoodi.arkiv.network/rpc';
const WS_URL  = 'wss://kaolin.hoodi.arkiv.network/rpc/ws';

// 2) Quick sanity check: private keys are 32 bytes (64 hex chars) prefixed with 0x
if (!/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) throw new Error('Set PRIVATE_KEY');

// 3) Convert "0x…"-hex into raw bytes — the client expects bytes (not a string)
const hex = PRIVATE_KEY.slice(2);
const toBytes = (h) => new Uint8Array(h.match(/.{1,2}/g).map(b => parseInt(b, 16)));

// 4) Create a client (think: “connect my account to this network”)
const client = await createClient(
  CHAIN_ID,
  new Tagged('privatekey', toBytes(hex)),
  RPC_URL,
  WS_URL
);

// 5) Helpers to turn text ↔ bytes (blockchains store bytes)
const enc = new TextEncoder();
const dec = new TextDecoder();

// 6) Write one tiny record on-chain: "Hello, Arkiv!"
//    - btl: "blocks-to-live" (expiration window)
//    - stringAnnotations: small key/value tags you can later query by
const [hello] = await client.createEntities([{
  data: enc.encode('Hello, Arkiv!'),
  btl: 120,
  stringAnnotations: [{ key: 'type', value: 'hello' }],
  numericAnnotations: []
}]);

// 7) Read back what we just wrote
const bytes = await client.getStorageValue(hello.entityKey);

// 8) Print the results so you can see the on-chain key and message
console.log('Key:', hello.entityKey);
console.log('Data:', dec.decode(bytes));
`;

  const story = useMemo(
    () => ({
      // Chapter 1 — Identity → Hello (in one flow)
      fundHello: {
        fundP: `Every action on Arkiv comes from an account. First, create (or use) an account and give it a small faucet top-up so it can write. This is your identity for the rest of the guide.`,
        fundBullets: [
          { t: "Goal", v: "Have an address with enough funds to write once." },
          {
            t: "Why it matters",
            v: "Writing data costs gas; the faucet covers your first steps.",
          },
          { t: "Success check", v: "Your address shows a non-zero balance." },
        ] as Bullet[],

        helloP: `Now prove everything works end-to-end by writing one tiny entity: “Hello, Arkiv!”. You’ll reuse this same account later when we turn it into a Voting Board.`,
        helloBullets: [
          { t: "Goal", v: "Use your account + RPC to create a single entity." },
          {
            t: "Why it matters",
            v: "Confirms your identity and connection before we build more.",
          },
          {
            t: "Success check",
            v: "Console prints your address and the new entity key.",
          },
        ] as Bullet[],
      },

      // Bridge — move from playground to local when ready
      setupInstall: {
        p: `Now that you’ve seen how a simple “Hello, Arkiv!” message works in the browser, let’s prepare your own local setup.
This will let you keep building - turning that one-off Hello into a reusable script that powers the Voting Board.
You’ll still use the same building blocks (account, client, and connection), but now inside your own workspace.`,
      },

      // Chapter 2 — Turn the hello-setup into a “client”
      connect: {
        p: `Reuse your account to create a client that can sign and send. This is the same identity from Hello—now formalized as a reusable connection for the rest of the journey.`,
        bullets: [
          {
            t: "Goal",
            v: "Instantiate a client with your private key and RPC.",
          },
          {
            t: "Why it matters",
            v: "All writes/reads will flow through this client.",
          },
          {
            t: "Success check",
            v: "Your script logs the account address from the client.",
          },
        ] as Bullet[],
      },

      // Chapter 3 — Open the decision “room”
      open: {
        p: `Create the decision “room”: a proposal entity with a bounded time window (BTL). This is where votes will attach—still using the very same client/account you verified.`,
        bullets: [
          {
            t: "Goal",
            v: "Write a proposal entity with an expiration window (BTL).",
          },
          {
            t: "Why it matters",
            v: "Gives your vote stream a clear scope and predictable cost.",
          },
          {
            t: "Success check",
            v: "You get a proposal.entityKey (the proposal ID).",
          },
        ] as Bullet[],
      },

      // Chapter 4 — Let participants speak
      cast: {
        p: `Attach votes to the proposal. Each vote is its own entity linked by proposalKey and attributed to a voter address. Same client, same journey—now with multiple actors.`,
        bullets: [
          {
            t: "Goal",
            v: 'Create votes with { type="vote", proposalKey, voter, choice }.',
          },
          {
            t: "Why it matters",
            v: "Votes are small, auditable facts you can query later.",
          },
          {
            t: "Success check",
            v: "Two vote keys print, both linked to your proposal.",
          },
        ] as Bullet[],
      },

      // Chapter 5 — Scale the interaction
      batch: {
        p: `Add many votes in one go—useful for demos, fixtures, or cross-proposal actions. You’re still operating with the same client and proposal context.`,
        bullets: [
          { t: "Goal", v: "Create multiple vote entities in a single call." },
          {
            t: "Success check",
            v: "Receipt count matches the number you pushed.",
          },
        ] as Bullet[],
      },

      // Chapter 6 — Read the truth
      tally: {
        p: `Read the chain back. Query annotated entities to compute the result. Because reads are deterministic, the same query yields the same answer.`,
        bullets: [
          { t: "Goal", v: "Query votes by proposalKey and choice." },
          { t: "Success check", v: "YES/NO counts match your inputs." },
        ] as Bullet[],
      },

      // Chapter 7 — Watch it live
      listen: {
        p: `Subscribe to creations and extensions in real time. No polling—just logs as the story unfolds. Keep the same client; it already knows where to listen.`,
        bullets: [
          {
            t: "Goal",
            v: "Subscribe to creation and extension events for votes (and proposals).",
          },
          {
            t: "Success check",
            v: "Console logs “[Vote created] …” or “[Vote extended] …”.",
          },
        ] as Bullet[],
      },

      // Chapter 8 — Change the timeline
      extend: {
        p: `Need more time to decide? Extend the proposal’s BTL. You’re updating the same entity you opened earlier—continuing the narrative of one decision from start to finish.`,
        bullets: [
          { t: "Goal", v: "Extend the proposal entity by N blocks." },
          { t: "Success check", v: "Console prints the new expiration block." },
        ] as Bullet[],
      },
    }),
    [],
  );

  // Sticky nav highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && setActiveSection(e.target.id),
        ),
      {
        root: null,
        rootMargin: "-100px 0px -80% 0px",
        threshold: 0,
      },
    );
    const sections = document.querySelectorAll("section[id]");
    sections.forEach((s) => observer.observe(s));
    return () => sections.forEach((s) => observer.unobserve(s));
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 120;
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  // New order (merged first step): Hello Arkiv → Setup → Connect → Open → Cast → Batch → Tally → Watch → Extend → Help
  const navItems = [
    { id: "fund-hello", label: "1) Hello Arkiv", icon: "💸" },
    { id: "setup-install", label: "2) Setup & Installation", icon: "🧰" },
    { id: "connect", label: "3) Connect & Verify", icon: "🔗" },
    { id: "open", label: "4) Open Proposal", icon: "📥" },
    { id: "cast", label: "5) Cast Votes", icon: "🗳️" },
    { id: "batch", label: "6) (Optional) Batch", icon: "📦" },
    { id: "tally", label: "7) Tally Votes", icon: "🔢" },
    { id: "listen", label: "8) Watch Live", icon: "📡" },
    { id: "extend", label: "9) Extend Window", icon: "⏱️" },
    { id: "help", label: "Troubleshooting", icon: "🔧" },
  ];

  const faucetHref = "https://kaolin.hoodi.arkiv.network/faucet/";

  function generateWallet() {
    const w = Wallet.createRandom();
    setGenerated({ address: w.address, privateKey: w.privateKey });
    setCopied(null);
  }

  function resetGenerated() {
    setGenerated(null);
    setCopied(null);
  }
  async function copy(text: string, field: "address" | "privateKey") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white pt-28">
        <main className="relative z-10">
          <div className="max-w-[1280px] mx-auto px-4 md:px-[60px] py-12">
            {/* Header */}
            <div className="text-center space-y-4 mb-12">
              <div className="inline-block px-4 py-2 bg-[#FE7445] text-white text-sm font-mono rounded-lg shadow-figma-button-primary">
                TypeScript SDK v0.1.16
              </div>
              <h1 className="text-4xl md:text-5xl font-brutal font-black uppercase text-black">
                Arkiv TS SDK — Getting Started
              </h1>
              <p className="text-xl font-mono text-[#1F1F1F] max-w-3xl mx-auto">
                Voting Board: Open a proposal, collect votes in real time, tally
                them, batch more votes, then extend the voting window.
              </p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 font-mono text-xs text-stone-700">
                <span>Flow</span>
                <span>•</span>
                <span>
                  Hello Arkiv → Setup → Connect → Open → Cast → (Batch) → Tally
                  → Watch → Extend
                </span>
              </div>
            </div>

            {/* Sticky Nav */}
            <div className="sticky top-[88px] z-40 backdrop-blur-md border-b border-stone-300 bg-white/95 -mx-4 px-4 py-3 mb-12">
              <div className="flex items-center gap-4 overflow-x-auto">
                <a
                  href="/"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono bg-gray-200 text-black hover:bg-[#FE7445] hover:text-white transition-all whitespace-nowrap"
                >
                  Home
                </a>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono transition-all whitespace-nowrap ${
                      activeSection === item.id
                        ? "bg-[#FE7445] text-white"
                        : "bg-gray-200 text-black hover:bg-[#FE7445] hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1) Hello Arkiv */}
            <section id="fund-hello" className="mb-16">
              <h2 className="text-3xl font-bold mb-8">1) Say “Hello, Arkiv”</h2>

              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                {/* Friendly intro (inline tooltips) */}
                <div className="mb-6">
                  <h3 className="text-lg font-brutal font-bold text-black mb-2">
                    Your first on-chain action (no installs)
                  </h3>
                  <p className="font-mono text-sm text-stone-900">
                    In web3, you act from an{" "}
                    <T term="account">
                      Your on-chain identity made of a public address and a
                      private key.
                    </T>
                    . Your{" "}
                    <T term="address">
                      Public identifier that others can view or send assets to.
                    </T>{" "}
                    is safe to share, but your{" "}
                    <T term="private key">
                      Your secret credential. Keep it private — anyone with it
                      controls your account.
                    </T>
                    . Writing to the chain uses{" "}
                    <T term="gas">
                      A tiny fee paid to execute your write; we’ll use test
                      funds on a test network.
                    </T>
                    .
                  </p>
                </div>

                {/* Safety note */}
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-4">
                  <p className="font-mono text-sm text-amber-900">
                    <b>Safety:</b> The account you generate here is for{" "}
                    <b>demo/sandbox use only</b>. Don’t use it for real value.
                  </p>
                </div>

                {/* Step A — Generate */}
                <div className="mb-4">
                  <h3 className="text-lg font-brutal font-bold text-black mb-2">
                    A) Generate an account
                  </h3>
                  <p className="font-mono text-sm text-stone-900 mb-3">
                    Click once. We’ll create a new{" "}
                    <T term="account">
                      Address + private key pair in your browser.
                    </T>
                  </p>
                  <button
                    onClick={generateWallet}
                    className="px-4 py-2 rounded-lg bg-black text-white font-mono text-sm hover:opacity-90 transition"
                  >
                    Generate account
                  </button>
                </div>

                {/* Keys display */}
                {generated && (
                  <div className="rounded-xl border border-stone-300 bg-white p-4 space-y-4 mb-6">
                    <FieldRow
                      label="Account Address"
                      value={generated.address}
                      onCopy={() => copy(generated.address, "address")}
                      copied={copied === "address"}
                    />
                    <FieldRow
                      label="Private Key"
                      value={generated.privateKey}
                      onCopy={() => copy(generated.privateKey, "privateKey")}
                      copied={copied === "privateKey"}
                    />
                    <p className="text-xs font-mono text-stone-700">
                      Save these somewhere safe. You’ll use them in the next
                      step.
                    </p>
                  </div>
                )}

                {/* Step B — Fund */}
                <div className="mb-6">
                  <h3 className="text-lg font-brutal font-bold text-black mb-2">
                    B) Add faucet funds
                  </h3>
                  <p className="font-mono text-sm text-stone-900 mb-3">
                    Open the{" "}
                    <T term="faucet">
                      A website that sends free test ETH on a test network.
                    </T>{" "}
                    and paste an{" "}
                    <T term="address">
                      Your public account string (starts with 0x…)
                    </T>
                    . If you generated one above, copy it. Otherwise, you can
                    paste an address from your own wallet.
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href={faucetHref}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-lg font-mono text-sm bg-[#0f766e] text-white hover:opacity-90 transition"
                    >
                      Open Faucet
                    </a>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-stone-300 my-6" />

                {/* Step C — Hello */}
                <div>
                  <h3 className="text-lg font-brutal font-bold text-black mb-2">
                    C) Say “Hello, Arkiv”
                  </h3>
                  <p className="font-mono text-sm text-stone-900 mb-3">
                    Run a tiny example in your browser that writes a single
                    on-chain record — no local setup required.
                  </p>
                  <CodePlayground
                    description={
                      generated
                        ? "Prefilled with the account you just created. Click Run."
                        : "Paste a private key at the top of the script, or generate one above. Then click Run."
                    }
                    initialCode={helloPlaygroundTs(generated?.privateKey)}
                    showLanguageToggle={false}
                  />
                  <p className="mt-2 text-xs font-mono text-stone-700">
                    We’ll prefill it to use the account you just created.
                  </p>
                </div>
              </div>
            </section>

            {/* 2) Setup & Installation */}
            <section id="setup-install" className="mb-16">
              <h2 className="text-3xl font-bold mb-8">
                2) Setup &amp; Installation
              </h2>

              {/* Overview */}
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card mb-6">
                <p className="text-stone-900 font-mono text-sm">
                  {story.setupInstall.p}
                </p>
              </div>

              {/* Prerequisites */}
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card mb-6">
                <h3 className="text-xl font-brutal font-bold mb-4 text-black">
                  Prerequisites
                </h3>
                <p className="text-stone-900 font-mono text-sm mb-4">
                  Tested with arkiv-sdk@0.1.16 and Node.js 20+. Bun also works.
                  works.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <CheckRow
                    title="Node.js 18+ (or Bun 1.x)"
                    subtitle="LTS recommended"
                  />
                  <CheckRow
                    title="TypeScript 5+ (optional)"
                    subtitle="For typed scripts"
                  />
                  <CheckRow
                    title="Ethereum Wallet"
                    subtitle="With test ETH for your RPC"
                  />
                  <CheckRow
                    title="RPC Endpoint"
                    subtitle="HTTP + (optionally) WS"
                  />
                </div>
              </div>

              {/* Installation */}
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card mb-6">
                <h3 className="text-xl font-brutal font-bold mb-2 text-black">
                  Installation
                </h3>
                <CodeBlock
                  language="bash"
                  code={`# Using npm
npm init -y
npm i arkiv-sdk dotenv tslib ethers

# or with Bun
bun init -y
bun add arkiv-sdk dotenv tslib ethers`}
                />
              </div>

              {/* Optional config files */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                  <h3 className="text-xl font-brutal font-bold mb-2 text-black">
                    tsconfig.json (optional)
                  </h3>
                  <CodeBlock
                    language="json"
                    code={`{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["*.ts"]
}`}
                  />
                </div>
                <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                  <h3 className="text-xl font-brutal font-bold mb-2 text-black">
                    package.json (scripts)
                  </h3>
                  <CodeBlock
                    language="json"
                    code={`{
  "type": "module",
  "scripts": {
    "start": "tsx voting-board.ts",
    "build": "tsc",
    "dev": "tsx watch voting-board.ts"
  },
  "dependencies": {
    "arkiv-sdk": "^0.1.16",
    "dotenv": "^16.4.5",
    "tslib": "^2.8.1",
    "ethers": "^6.13.4"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "typescript": "^5.6.3"
  }
}`}
                  />
                </div>
              </div>

              {/* Environment Configuration */}
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                <h3 className="text-xl font-brutal font-bold mb-2 text-black">
                  Environment Configuration
                </h3>
                <CodeBlock
                  language="bash"
                  code={`# .env
PRIVATE_KEY=0x...                      # use the (TEST) private key generated above
RPC_URL=https://your.rpc.endpoint/rpc    # e.g. https://kaolin.hoodi.arkiv.network/rpc
WS_URL=wss://your.rpc.endpoint/rpc/ws    # e.g. wss://kaolin.hoodi.arkiv.network/rpc/ws`}
                />
              </div>
            </section>

            {/* 3) Connect & Verify */}
            <section id="connect" className="mb-16">
              <h2 className="text-3xl font-bold mb-8">
                3) Connect &amp; Verify
              </h2>
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                <p className="font-mono text-sm text-stone-900 mb-4">
                  {story.connect.p}
                </p>
                <ul className="list-disc list-inside font-mono text-sm text-stone-900 space-y-1 mb-4">
                  {story.connect.bullets.map((b) => (
                    <li key={b.t}>
                      <b>{b.t}:</b> {b.v}
                    </li>
                  ))}
                </ul>
                <CodeBlock
                  language="typescript"
                  code={`import 'dotenv/config';
import { createClient, Annotation, Tagged, type AccountData, type GolemBaseCreate } from 'arkiv-sdk';

// Helper: query RPC for basic network info
async function getChainId(rpcUrl: string): Promise<number> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
  });
  const json = await res.json();
  if (!json?.result) throw new Error('RPC eth_chainId failed');
  return Number(json.result);
}

const rawKey = process.env.PRIVATE_KEY ?? '';
if (!rawKey) throw new Error('Missing PRIVATE_KEY in .env');
const hex = rawKey.startsWith('0x') ? rawKey.slice(2) : rawKey;
const key: AccountData = new Tagged('privatekey', Buffer.from(hex, 'hex'));

const rpcUrl = process.env.RPC_URL ?? '';
const wsUrl  = process.env.WS_URL  ?? '';
if (!rpcUrl) throw new Error('Missing RPC_URL in .env');

const chainId = await getChainId(rpcUrl);
const client = await createClient(chainId, key, rpcUrl, wsUrl);
console.log('Connected.');

const enc = new TextEncoder();
const decoder = new TextDecoder();

const owner = await (client as any).getOwnerAddress?.();
if (owner) console.log('Your account:', owner);`}
                />
              </div>
            </section>

            {/* 4) Open Proposal */}
            <section id="open" className="mb-16">
              <h2 className="text-3xl font-bold mb-8">4) Open Proposal</h2>
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                <p className="font-mono text-sm text-stone-900 mb-4">
                  {story.open.p}
                </p>
                <ul className="list-disc list-inside font-mono text-sm text-stone-900 space-y-1 mb-4">
                  {story.open.bullets.map((b) => (
                    <li key={b.t}>
                      <b>{b.t}:</b> {b.v}
                    </li>
                  ))}
                </ul>
                <CodeBlock
                  language="typescript"
                  code={`const [proposal] = await client.createEntities([
  {
    data: enc.encode('Proposal: Switch stand-up to 9:30?'),
    btl: 200,
    stringAnnotations: [
      new Annotation('type', 'proposal'),
      new Annotation('status', 'open'),
    ],
    numericAnnotations: [new Annotation('version', 1)],
  } as GolemBaseCreate,
]);
console.log('Proposal key:', proposal.entityKey);

// Use entityKey as this proposal's identifier
const proposalKey = proposal.entityKey;`}
                />
              </div>
            </section>

            {/* 5) Cast Votes */}
            <section id="cast" className="mb-16">
              <h2 className="text-3xl font-bold mb-8">5) Cast Votes</h2>
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                <p className="font-mono text-sm text-stone-900 mb-4">
                  {story.cast.p}
                </p>
                <ul className="list-disc list-inside font-mono text-sm text-stone-900 space-y-1 mb-4">
                  {story.cast.bullets.map((b) => (
                    <li key={b.t}>
                      <b>{b.t}:</b> {b.v}
                    </li>
                  ))}
                </ul>
                <CodeBlock
                  language="typescript"
                  code={`const voterAddr = (await (client as any).getOwnerAddress?.()) ?? 'unknown';

const [vote1, vote2] = await client.createEntities([
  {
    data: enc.encode('vote: yes'),
    btl: 200,
    stringAnnotations: [
      new Annotation('type', 'vote'),
      new Annotation('proposalKey', proposalKey),
      new Annotation('voter', voterAddr),
      new Annotation('choice', 'yes'),
    ],
    numericAnnotations: [new Annotation('weight', 1)],
  },
  {
    data: enc.encode('vote: no'),
    btl: 200,
    stringAnnotations: [
      new Annotation('type', 'vote'),
      new Annotation('proposalKey', proposalKey),
      new Annotation('voter', voterAddr),
      new Annotation('choice', 'no'),
    ],
    numericAnnotations: [new Annotation('weight', 1)],
  },
] as GolemBaseCreate[]);
console.log('Votes cast:', vote1.entityKey, vote2.entityKey);`}
                />
              </div>
            </section>

            {/* 6) (Optional) Batch Votes */}
            <section id="batch" className="mb-16">
              <h2 className="text-3xl font-bold mb-8">
                6) (Optional) Batch Votes
              </h2>
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                <p className="font-mono text-sm text-stone-900 mb-4">
                  {story.batch.p}
                </p>
                <ul className="list-disc list-inside font-mono text-sm text-stone-900 space-y-1 mb-4">
                  {story.batch.bullets.map((b) => (
                    <li key={b.t}>
                      <b>{b.t}:</b> {b.v}
                    </li>
                  ))}
                </ul>
                <CodeBlock
                  language="typescript"
                  code={`const extras = Array.from({ length: 5 }, (_, i) => ({
  data: enc.encode(\`vote: yes #\${i + 1}\`),
  btl: 200,
  stringAnnotations: [
    new Annotation('type', 'vote'),
    new Annotation('proposalKey', proposalKey),
    new Annotation('voter', \`\${voterAddr}-bot\${i}\`),
    new Annotation('choice', 'yes'),
  ],
  numericAnnotations: [new Annotation('weight', 1)],
})) as GolemBaseCreate[];

const receipts = await client.createEntities(extras);
console.log(\`Batch created: \${receipts.length} votes\`);`}
                />
              </div>
            </section>

            {/* 7) Tally Votes */}
            <section id="tally" className="mb-16">
              <h2 className="text-3xl font-bold mb-8">7) Tally Votes</h2>
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                <p className="font-mono text-sm text-stone-900 mb-4">
                  {story.tally.p}
                </p>
                <ul className="list-disc list-inside font-mono text-sm text-stone-900 space-y-1 mb-4">
                  {story.tally.bullets.map((b) => (
                    <li key={b.t}>
                      <b>{b.t}:</b> {b.v}
                    </li>
                  ))}
                </ul>
                <CodeBlock
                  language="typescript"
                  code={`const yesVotes = await client.queryEntities(
  \`type = "vote" && proposalKey = "\${proposalKey}" && choice = "yes"\`
);
const noVotes = await client.queryEntities(
  \`type = "vote" && proposalKey = "\${proposalKey}" && choice = "no"\`
);
console.log(\`Tallies — YES: \${yesVotes.length}, NO: \${noVotes.length}\`);`}
                />
              </div>
            </section>

            {/* 8) Watch Live */}
            <section id="listen" className="mb-16">
              <h2 className="text-3xl font-bold mb-8">8) Watch Live</h2>
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                <p className="font-mono text-sm text-stone-900 mb-4">
                  {story.listen.p}
                </p>
                <ul className="list-disc list-inside font-mono text-sm text-stone-900 space-y-1 mb-4">
                  {story.listen.bullets.map((b) => (
                    <li key={b.t}>
                      <b>{b.t}:</b> {b.v}
                    </li>
                  ))}
                </ul>
                <CodeBlock
                  language="typescript"
                  code={`const stopWatching = client.watchLogs({
  fromBlock: BigInt(0),

  onCreated: (e) => {
    void (async () => {
      try {
        const meta = await (client as any).getEntityMetaData?.(e.entityKey);
        const strs = Object.fromEntries((meta?.stringAnnotations ?? [])
          .map((a: any) => [a.key, a.value]));
        if (strs.type === 'vote') {
          const data = await client.getStorageValue(e.entityKey);
          console.log('[Vote created]', decoder.decode(data), 'key=', e.entityKey);
        } else if (strs.type === 'proposal') {
          const data = await client.getStorageValue(e.entityKey);
          console.log('[Proposal created]', decoder.decode(data), 'key=', e.entityKey);
        }
      } catch {}
    })();
  },

  onExtended: (e) => {
    void (async () => {
      try {
        const meta = await (client as any).getEntityMetaData?.(e.entityKey);
        const strs = Object.fromEntries((meta?.stringAnnotations ?? [])
          .map((a: any) => [a.key, a.value]));
        if (strs.type === 'vote') {
          console.log('[Vote extended]', 'key=', e.entityKey, '→', e.newExpirationBlock);
        } else if (strs.type === 'proposal') {
          console.log('[Proposal extended]', 'key=', e.entityKey, '→', e.newExpirationBlock);
        }
      } catch {}
    })();
  },

  onUpdated: () => {},
  onDeleted: () => {},
  onError: (err) => console.error('[watchLogs] error:', err),
});
console.log('Watching for proposal/vote creations and extensions…');`}
                />
              </div>
            </section>

            {/* 9) Extend Window */}
            <section id="extend" className="mb-16">
              <h2 className="text-3xl font-bold mb-8">9) Extend Window</h2>
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                <p className="font-mono text-sm text-stone-900 mb-4">
                  {story.extend.p}
                </p>
                <ul className="list-disc list-inside font-mono text-sm text-stone-900 space-y-1 mb-4">
                  {story.extend.bullets.map((b) => (
                    <li key={b.t}>
                      <b>{b.t}:</b> {b.v}
                    </li>
                  ))}
                </ul>
                <CodeBlock
                  language="typescript"
                  code={`const [ext] = await client.extendEntities([
  { entityKey: proposal.entityKey, numberOfBlocks: 150 },
]);
console.log('Proposal extended to block:', ext.newExpirationBlock);`}
                />
              </div>
            </section>

            {/* Troubleshooting */}
            <section id="help" className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Troubleshooting</h2>
              <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card space-y-4">
                <p className="font-mono text-sm text-stone-900">
                  <b>Invalid sender:</b> Your RPC may point to an unexpected
                  network for your key. Verify your RPC URL is correct.
                </p>
                <p className="font-mono text-sm text-stone-900">
                  <b>Insufficient funds:</b> Get test ETH from the faucet;
                  writes require gas.
                </p>
                <p className="font-mono text-sm text-stone-900">
                  <b>No events seen?</b> Ensure <code>fromBlock</code> is low
                  enough and keep the process running to receive logs.
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

function CheckRow({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#FE7445] text-xl">✓</div>
      <div>
        <p className="font-mono font-medium text-black">{title}</p>
        {subtitle && (
          <p className="text-sm font-mono text-stone-900">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/** A tidy row with label, value, and right-aligned copy button on the same line */
function FieldRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-stone-500 font-mono mb-1">
        {label}
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
        <div className="font-mono break-all text-sm bg-black/5 rounded-lg px-3 py-2">
          {value}
        </div>
        <button
          onClick={onCopy}
          className="px-3 py-2 rounded-lg bg-gray-200 text-black font-mono text-xs hover:bg-gray-300 transition"
          aria-label={`Copy ${label}`}
        >
          {copied ? "Copied ✓" : `Copy ${label.toLowerCase()}`}
        </button>
      </div>
    </div>
  );
}
