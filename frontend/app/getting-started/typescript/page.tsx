"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Wallet } from "ethers";
import { CodePlayground } from "@/components/ui/CodePlayground";

// Force this page to be dynamic (not statically pre-rendered)
export const dynamic = 'force-dynamic';

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
  const [balance, setBalance] = useState<string | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [faucetClicked, setFaucetClicked] = useState(false);
  const [lastEntityKey, setLastEntityKey] = useState<string | null>(null);

  const helloPlaygroundTs = (
      generatedPk?: string,
  ) => `const PRIVATE_KEY = '${generatedPk ?? "0xYOUR_PRIVATE_KEY"}';

// 1) Connect your account to Arkiv
const client = await createClient(
  60138453025, // CHAIN_ID
  new Tagged('privatekey', Buffer.from(PRIVATE_KEY.slice(2), 'hex')), // convert to raw bytes
  'https://kaolin.hoodi.arkiv.network/rpc', // RPC endpoint
  'wss://kaolin.hoodi.arkiv.network/rpc/ws'  // WS endpoint
);

// 2) Write one small record on-chain
const [hello] = await client.createEntities([{
  data: new TextEncoder().encode('Hello, Arkiv!'), // encode text to bytes
  expiresIn: 120, // time-to-live in seconds
  stringAnnotations: [new Annotation('type', 'hello')], // searchable metadata
  numericAnnotations: []
}]);

// 3) Read it back and decode to string
const bytes = await client.getStorageValue(hello.entityKey);

// 4) Display results
console.log('Key:', hello.entityKey);
console.log('Data:', ethers.toUtf8String(bytes)); // decode bytes → text
`;


  const story = useMemo(
      () => ({
        // Chapter 1 - Identity → Hello (in one flow)
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

        // Bridge - move from playground to local when ready
        setupInstall: {
          p: `If you want to run this outside the browser (CI, local ts-node, a service),
          set up the SDK in your own project. This section shows package.json, .env and a
          reference script so you can run the same Voting Board flow from your terminal.`,
        },

        // Chapter 2
        connect: {
          p1: `You can write to Arkiv now - good. Let’s use the same account and client to build something structured: a tiny Voting Board. You can keep experimenting right here in the CodePlayground, or `,
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

        // Chapter 3 - Open the decision “room”
        open: {
          p: `Create the decision “room”: a proposal entity with a bounded time window (Expires In). This is where votes will attach-still using the very same client/account you verified.`,
          bullets: [
            {
              t: "Goal",
              v: "Write a proposal entity with an expiration window (Expires In).",
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

        // Chapter 4 - Let participants speak
        cast: {
          p: `Attach votes to the proposal. Each vote is its own entity linked by proposalKey and attributed to a voter address. Same client, same journey-now with multiple actors.`,
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

        // Chapter 5 - Scale the interaction
        batch: {
          p: `Add many votes in one go-useful for demos, fixtures, or cross-proposal actions. You’re still operating with the same client and proposal context.`,
          bullets: [
            { t: "Goal", v: "Create multiple vote entities in a single call." },
            {
              t: "Success check",
              v: "Receipt count matches the number you pushed.",
            },
          ] as Bullet[],
        },

        // Chapter 6 - Read the truth
        tally: {
          p: `Read the chain back. Query annotated entities to compute the result. Because reads are deterministic, the same query yields the same answer.`,
          bullets: [
            { t: "Goal", v: "Query votes by proposalKey and choice." },
            { t: "Success check", v: "YES/NO counts match your inputs." },
          ] as Bullet[],
        },

        // Chapter 7 - Watch it live
        listen: {
          p: `Subscribe to creations and extensions in real time. No polling-just logs as the story unfolds. Keep the same client; it already knows where to listen.`,
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

        // Chapter 8 - Change the timeline
        extend: {
          p: `Need more time to decide? Extend the proposal’s Expires In. You’re updating the same entity you opened earlier-continuing the narrative of one decision from start to finish.`,
          bullets: [
            { t: "Goal", v: "Extend the proposal entity by N blocks." },
            { t: "Success check", v: "Console prints the new expiration block." },
          ] as Bullet[],
        },
      }),
      [],
  );

  // Balance checker - poll every 3 seconds when faucet is clicked
  useEffect(() => {
    console.log('[Balance Checker] useEffect triggered', {
      hasAddress: !!generated?.address,
      address: generated?.address,
      faucetClicked
    });

    if (!generated?.address || !faucetClicked) {
      console.log('[Balance Checker] Early return - missing address or faucet not clicked');
      setBalance(null);
      setIsCheckingBalance(false);
      return;
    }

    console.log('[Balance Checker] Starting balance checking...');
    setIsCheckingBalance(true);

    const checkBalance = async () => {
      try {
        console.log('[Balance Checker] Fetching balance for:', generated.address);
        const response = await fetch('https://kaolin.hoodi.arkiv.network/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBalance',
            params: [generated.address, 'latest']
          })
        });

        const data = await response.json();
        console.log('[Balance Checker] RPC response:', data);

        if (data.result) {
          // Convert from hex wei to ETH
          const balanceWei = BigInt(data.result);
          const balanceEth = Number(balanceWei) / 1e18;
          console.log('[Balance Checker] Balance converted:', {
            hex: data.result,
            wei: balanceWei.toString(),
            eth: balanceEth
          });
          setBalance(balanceEth.toFixed(6));
        }
      } catch (error) {
        console.error('[Balance Checker] Error:', error);
      }
    };

    // Check immediately
    console.log('[Balance Checker] Running initial check');
    checkBalance();

    // Then check every 3 seconds
    console.log('[Balance Checker] Setting up interval (3s)');
    const interval = setInterval(checkBalance, 3000);

    return () => {
      console.log('[Balance Checker] Cleanup - clearing interval');
      clearInterval(interval);
    };
  }, [generated?.address, faucetClicked]);

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
    { id: "fund-hello", label: "1) Hello World!", icon: "💸" },
    { id: "connect", label: "2) Voting Board", icon: "🔗" },
    { id: "open", label: "3) Open Proposal", icon: "📥" },
    { id: "cast", label: "4) Cast Votes", icon: "🗳️" },
    { id: "batch", label: "5) Batch Votes", icon: "📦" },
    { id: "tally", label: "6) Tally Votes", icon: "🔢" },
    { id: "listen", label: "7) Watch Live", icon: "📡" },
    { id: "extend", label: "8) Extend Window", icon: "⏱️" },
    { id: "setup-install", label: "Setup & Installation", icon: "🧰" },
    { id: "help", label: "Troubleshooting", icon: "🔧" },
  ];

  const faucetHref = "https://kaolin.hoodi.arkiv.network/faucet/";

  function generateWallet() {
    const w = Wallet.createRandom();
    setGenerated({ address: "0xAe687247db694b9960480D20c13Aeed7751c0567", privateKey: "0x14f33c0d791b9d5e9b7311b4b7eded64ddc308b2ac13c4d9e12534e9b49ac716" });
    setCopied(null);
  }

  function resetGenerated() {
    setGenerated(null);
    setCopied(null);
    setFaucetClicked(false);
    setBalance(null);
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
                  SDK v0.1.19
                </div>
                <h1 className="text-4xl md:text-5xl font-brutal font-black uppercase text-black">
                  Arkiv SDK for TS - Getting Started
                </h1>
                {/*<p className="text-xl font-mono text-[#1F1F1F] max-w-3xl mx-auto">*/}
                {/*  Voting Board: Open a proposal, collect votes in real time, tally*/}
                {/*  them, batch more votes, then extend the voting window.*/}
                {/*</p>*/}
                <p className="text-sm font-mono text-gray-500 mt-2">
                  Last updated: January 2025
                </p>
                {/*<div className="mt-2 inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 font-mono text-xs text-stone-700">*/}
                {/*  <span>Flow</span>*/}
                {/*  <span>•</span>*/}
                {/*  <span>*/}
                {/*    Hello, World! · Setup · Connect · Open · Cast · (Batch) · Tally*/}
                {/*    · Watch · Extend*/}
                {/*  </span>*/}
                {/*</div>*/}
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
                <h2 className="text-3xl font-bold mb-8">1) Arkiv "Hello, World!"</h2>

                <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card">
                  {/* Friendly intro (inline tooltips) */}
                  <div className="mb-6">
                    <h3 className="text-lg font-brutal font-bold text-black mb-2">
                      Create your account
                    </h3>
                    <p className="font-mono text-sm text-stone-900">
                      This {" "}
                      <T term="account">
                        Your on-chain identity made of a public address and a
                        private key.
                      </T> {" "}
                      allows you to interact with Arkiv Testnet. Your{" "}
                      <T term="address">
                        Public identifier that others can view or send assets to.
                      </T>{" "}
                      is safe to share. Never share your {" "}
                      <T term="private key">
                        Your secret credential. Keep it private - anyone with it
                        controls your account.
                      </T>
                      .
                    </p>
                  </div>

                  {/* Step A - Generate (only show button if not generated) */}
                  {!generated && (
                      <div className="mb-4">
                        <button
                            onClick={generateWallet}
                            className="px-4 py-2 rounded-lg bg-black text-white font-mono text-sm hover:opacity-90 transition"
                        >
                          Generate account
                        </button>
                      </div>
                  )}

                  {/* Safety note */}
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-4">
                    <p className="font-mono text-sm text-amber-900">
                      <b>Safety:</b> The account you generate here is for{" "}
                      <b>Arkiv Testnet/sandbox use only</b>. Never use it on any Mainnet.
                    </p>
                  </div>

                  {/* Keys display - shown after generation */}
                  {generated && (
                      <>
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
                            Save these somewhere safe. You'll use them in the next step
                          </p>
                        </div>

                        {/* Step B - Fund account */}
                        <div className="mb-6">
                          <h3 className="text-lg font-brutal font-bold text-black mb-2">
                            Now let's add funds to your account
                          </h3>
                          <p className="font-mono text-sm text-stone-900 mb-3">
                            Open the{" "}
                            <T term="faucet">
                              A website that sends free test ETH on a test network.
                            </T>{" "}
                            to{" "}
                            <T term="fund">
                              Writing to the chain uses funds -
                              A tiny fee paid to execute your write
                            </T>{" "}
                            your account.
                            Please paste your{" "}
                            <T term="address">
                              Public account string (starts with 0x…)
                            </T>{" "}
                            from above.
                          </p>


                          {/* Show Open Faucet button only if not clicked yet */}
                          {!faucetClicked && (
                              <button
                                  onClick={() => {
                                    console.log('Opening faucet, setting faucetClicked to true');
                                    window.open(faucetHref, '_blank');
                                    setFaucetClicked(true);
                                    console.log('faucetClicked state updated');
                                  }}
                                  className="px-4 py-2 rounded-lg font-mono text-sm bg-[#0f766e] text-white hover:opacity-90 transition"
                              >
                                Open Faucet
                              </button>
                          )}

                          {/* Balance checker - shown after faucet clicked */}
                          {faucetClicked && isCheckingBalance && (
                              <>
                                <div className={`p-3 rounded-lg border ${
                                    balance && parseFloat(balance) > 0
                                        ? 'bg-green-50 border-green-300'
                                        : 'bg-amber-50 border-amber-300'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-mono text-xs uppercase tracking-wider text-stone-500">Balance</p>
                                      <p className="font-mono text-lg font-bold">
                                        {balance || '0.000000'} ETH
                                      </p>
                                    </div>
                                    {balance && parseFloat(balance) > 0 ? (
                                        <div className="text-green-600 font-mono text-sm font-bold">
                                          ✓ Ready
                                        </div>
                                    ) : (
                                        <div className="text-amber-600 font-mono text-sm font-bold animate-pulse">
                                          ⟳ Checking...
                                        </div>
                                    )}
                                  </div>
                                </div>

                                {/* Warning when no funds */}
                                {(!balance || parseFloat(balance) === 0) && (
                                    <p className="font-mono text-sm text-amber-900 mt-3 font-bold">
                                      ⚠️ You need to add funds to your account, we can't proceed to the next step without them.
                                    </p>
                                )}
                              </>
                          )}
                        </div>

                        {/* Step C - Hello (only show when balance > 0) */}
                        {balance && parseFloat(balance) > 0 && (
                            <>
                              <div className="border-t border-stone-300 my-6" />
                              <div>
                                <h3 className="text-lg font-brutal font-bold text-black mb-2">
                                  Say "Hello, World!"
                                </h3>
                                <p className="font-mono text-sm text-stone-900 mb-3">
                                  Run this example in your browser that writes a single
                                  on-chain Arkiv entity - no local setup required.
                                </p>
                                <CodePlayground
                                    key={generated?.privateKey || 'no-key'}
                                    description="Your account is prefilled and funded. Click the green Run button to execute."
                                    initialCode={helloPlaygroundTs(generated.privateKey)}
                                    showLanguageToggle={false}
                                    hideWalletButton={true}
                                    hideSaveButton={true}
                                    onOutput={(out) => {
                                      let key: string | null = null;

                                      const jsonLine = out
                                          .split("\n")
                                          .map((l) => l.trim())
                                          .find((l) => l.startsWith("{") && l.endsWith("}"));
                                      if (jsonLine) {
                                        try {
                                          const parsed = JSON.parse(jsonLine);
                                          if (parsed.entityKey) key = parsed.entityKey;
                                        } catch {}
                                      }

                                      if (!key) {
                                        const m = out.match(/Key:\s*(0x[a-fA-F0-9]+)/);
                                        if (m) key = m[1];
                                      }

                                      if (key) {
                                        setLastEntityKey(key);
                                      }
                                    }}
                                />
                                {lastEntityKey && (
                                    <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 font-mono text-sm break-all">
                                      Check out your entity on our Arkiv Testnet block explorer:{" "}
                                      <a
                                          href={`https://explorer.kaolin.hoodi.arkiv.network/entity/${lastEntityKey}?tab=data`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="underline text-green-700"
                                      >
                                        https://explorer.kaolin.hoodi.arkiv.network/entity/${lastEntityKey}?tab=data
                                      </a>
                                    </div>
                                )}
                              </div>
                            </>
                        )}
                      </>
                  )}
                </div>
              </section>

              {/* 2) Voting Board */}
              <section id="connect" className="mb-16">
                <h2 className="text-3xl font-bold mb-8">2) Voting Board</h2>

                <div className="bg-gray-200 rounded-2xl p-6 border border-stone-300 shadow-figma-card space-y-6">
                  {/* Recap */}
                  <div className="rounded-lg bg-white/70 border border-stone-200 p-4">
                    <p className="font-mono text-sm text-stone-900">
                      You’ve written your first entity to Arkiv - now let’s build something
                      that feels more alive. Using the same test account and client, we’ll
                      create a tiny <b>Voting Board</b>: a simple structure where people can
                      open proposals, cast votes, and read results directly from the chain.
                    </p>
                    <p className="font-mono text-sm text-stone-900 mt-3">
                      This part of the guide shows how a few small entities can already form
                      a collaborative application - all powered by Arkiv.
                    </p>
                  </div>

                  {/* Path choice */}
                  <p className="font-mono text-sm text-stone-900">
                    You can keep experimenting right here in the <b>CodePlayground</b>, or{" "}
                    <a href="#setup-install" className="underline text-[#FE7445]">
                      set up the SDK locally
                    </a>{" "}
                    to continue from your own environment.
                  </p>

                  {/* Outline */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white/60 border border-stone-200 rounded-lg p-3">
                      <p className="font-mono text-xs uppercase tracking-wide text-stone-500 mb-1">
                        1. Proposal
                      </p>
                      <p className="font-mono text-sm text-stone-900">
                        A single entity that defines <b>what</b> is being decided and how long
                        the voting stays open (<code>expiresIn</code>).
                      </p>
                    </div>

                    <div className="bg-white/60 border border-stone-200 rounded-lg p-3">
                      <p className="font-mono text-xs uppercase tracking-wide text-stone-500 mb-1">
                        2. Votes
                      </p>
                      <p className="font-mono text-sm text-stone-900">
                        Multiple small entities that reference the proposal by its{" "}
                        <code>entityKey</code> and store each voter’s choice.
                      </p>
                    </div>

                    <div className="bg-white/60 border border-stone-200 rounded-lg p-3">
                      <p className="font-mono text-xs uppercase tracking-wide text-stone-500 mb-1">
                        3. Tally
                      </p>
                      <p className="font-mono text-sm text-stone-900">
                        A read query that fetches all votes linked to a proposal and counts
                        them - the simplest form of an on-chain result.
                      </p>
                    </div>
                  </div>

                  {/* Transition hint */}
                  <p className="font-mono text-xs text-stone-700">
                    Next up: we’ll create the proposal entity - the anchor for every vote that
                    follows.
                  </p>
                </div>
              </section>

              {/* 3) Open Proposal */}
              <section id="open" className="mb-16">
                <h2 className="text-3xl font-bold mb-8">3) Open Proposal</h2>
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
    expiresIn: 200, // 200 seconds
    stringAnnotations: [
      new Annotation('type', 'proposal'),
      new Annotation('status', 'open'),
    ],
    numericAnnotations: [new Annotation('version', 1)],
  } as ArkivCreate,
]);
console.log('Proposal key:', proposal.entityKey);

// Use entityKey as this proposal's identifier
const proposalKey = proposal.entityKey;`}
                  />
                </div>
              </section>

              {/* 4) Cast Votes */}
              <section id="cast" className="mb-16">
                <h2 className="text-3xl font-bold mb-8">4) Cast Votes</h2>
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
    expiresIn: 200, // 200 seconds
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
    expiresIn: 200, // 200 seconds
    stringAnnotations: [
      new Annotation('type', 'vote'),
      new Annotation('proposalKey', proposalKey),
      new Annotation('voter', voterAddr),
      new Annotation('choice', 'no'),
    ],
    numericAnnotations: [new Annotation('weight', 1)],
  },
] as ArkivCreate[]);
console.log('Votes cast:', vote1.entityKey, vote2.entityKey);`}
                  />
                </div>
              </section>

              {/* 5) Batch Votes */}
              <section id="batch" className="mb-16">
                <h2 className="text-3xl font-bold mb-8">
                  5) Batch Votes
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
  expiresIn: 200,
  stringAnnotations: [
    new Annotation('type', 'vote'),
    new Annotation('proposalKey', proposalKey),
    new Annotation('voter', \`\${voterAddr}-bot\${i}\`),
    new Annotation('choice', 'yes'),
  ],
  numericAnnotations: [new Annotation('weight', 1)],
})) as ArkivCreate[];

const receipts = await client.createEntities(extras);
console.log(\`Batch created: \${receipts.length} votes\`);`}
                  />
                </div>
              </section>

              {/* 6) Tally Votes */}
              <section id="tally" className="mb-16">
                <h2 className="text-3xl font-bold mb-8">6) Tally Votes</h2>
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
console.log(\`Tallies - YES: \${yesVotes.length}, NO: \${noVotes.length}\`);`}
                  />
                </div>
              </section>

              {/* 7) Watch Live */}
              <section id="listen" className="mb-16">
                <h2 className="text-3xl font-bold mb-8">7) Watch Live</h2>
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

              {/* 8) Extend Window */}
              <section id="extend" className="mb-16">
                <h2 className="text-3xl font-bold mb-8">8) Extend Window</h2>
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

              {/* Setup & Installation */}
              <section id="setup-install" className="mb-16">
                <h2 className="text-3xl font-bold mb-8">
                  Setup &amp; Installation
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
                    SDK v0.1.19 (tested with arkiv-sdk@0.1.19). Requires Node.js 18 (LTS) or newer; verified on Node.js 20. Support for Bun 1.x runtime is available.
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

                {/* Testnet Info Box */}
                <div className="mb-12 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl shadow-figma-card">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-brutal text-xl font-bold text-blue-900">
                        Arkiv Testnet "Kaolin" Resources
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <a
                          href="https://kaolin.hoodi.arkiv.network/faucet/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <span className="font-mono text-sm font-bold text-blue-900">💧 Faucet</span>
                      </a>
                      <a
                          href="https://explorer.kaolin.hoodi.arkiv.network/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <span className="font-mono text-sm font-bold text-blue-900">🔍 Explorer</span>
                      </a>
                      <button
                          onClick={() => {
                            navigator.clipboard.writeText('https://kaolin.hoodi.arkiv.network/rpc')
                            alert('RPC URL has been copied to clipboard')
                          }}
                          className="flex items-center justify-between gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer w-full text-left"
                          title="Click to copy RPC URL"
                      >
                    <span className="font-mono text-sm font-bold text-blue-900">
                      🌐 RPC
                    </span>
                        <svg className="w-4 h-4 text-blue-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <a
                          href="https://kaolin.hoodi.arkiv.network/bridgette/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <span className="font-mono text-sm font-bold text-blue-900">🌉 Bridge</span>
                      </a>
                    </div>
                    <a
                        href="https://kaolin.hoodi.arkiv.network/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="font-mono text-sm font-bold text-green-900">Arkiv Testnet Status</span>
                    </a>
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
    "arkiv-sdk": "^0.1.19",
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
