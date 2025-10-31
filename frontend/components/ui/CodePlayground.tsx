import { useState, useEffect } from "react";
import {
  Play,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  Save,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
    dataLayer?: any[];
  }
}

interface CodePlaygroundProps {
  initialCode: string;
  initialCodePython?: string;
  language?: "typescript" | "python";
  title?: string;
  description?: string;
  showLanguageToggle?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  hideWalletButton?: boolean;
  hideSaveButton?: boolean;
  onOutput?: (output: string) => void;
}

export function CodePlayground({
                                 initialCode,
                                 initialCodePython,
                                 language = "typescript",
                                 title,
                                 description,
                                 disabled = false,
                                 disabledMessage,
                                 showLanguageToggle = true,
                                 hideWalletButton = false,
                                 hideSaveButton = false,
                                 onOutput
                               }: CodePlaygroundProps) {
  const [currentLanguage, setCurrentLanguage] = useState<
      "typescript" | "python"
  >(language);
  const [tsCode, setTsCode] = useState(initialCode);
  const [pyCode, setPyCode] = useState(initialCodePython || "");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const code = currentLanguage === "typescript" ? tsCode : pyCode;
  const setCode = currentLanguage === "typescript" ? setTsCode : setPyCode;

  // Update code when example changes
  useEffect(() => {
    setTsCode(initialCode);
    setPyCode(initialCodePython || "");
    setOutput("");
    setError("");
  }, [initialCode, initialCodePython]);

  const connectMetaMask = async () => {
    if (typeof window.ethereum === "undefined") {
      setError(
          "MetaMask is not installed. Please install MetaMask to use this feature.",
      );
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);

        // Add Arkiv network to MetaMask if not already added
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xe0087f821", // 60138453025 in hex - correct Chain ID from RPC
                chainName: "Kaolin Testnet",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://kaolin.hoodi.arkiv.network/rpc"],
                blockExplorerUrls: [],
              },
            ],
          });
        } catch (addError) {
          console.log("Network already added or user rejected");
        }

        // Switch to Arkiv network
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xe0087f821" }],
        });

        setOutput(
            `Connected to MetaMask!\nWallet: ${accounts[0]}\nNetwork: Kaolin Testnet`,
        );

        // GTM Event: Wallet Connected
        if (typeof window !== 'undefined' && window.dataLayer) {
          window.dataLayer.push({
            event: 'walletConnected',
            wallet_type: 'MetaMask',
            network: 'Kaolin Testnet',
            page_path: window.location.pathname
          });
        }
      }
    } catch (err) {
      setError(
          err instanceof Error ? err.message : "Failed to connect MetaMask",
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setError("");
    setOutput("");

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language: currentLanguage,
          walletAddress: walletAddress, // Pass connected wallet if available
        }),
      });

      if (!response.ok) {
        // If response is not ok, check if it's JSON or HTML
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Execution failed");
        } else {
          // It's likely an HTML error page (404, 500, etc.)
          throw new Error(
              `API Error: ${response.status} ${response.statusText}. The code execution endpoint is not available.`,
          );
        }
      }

      const data = await response.json();

      setOutput(data.output);
      onOutput?.(data.output);

      // GTM Event: Code Execution Success
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'codeExecuted',
          language: currentLanguage,
          code_type: code === (currentLanguage === 'typescript' ? initialCode : initialCodePython) ? 'example' : 'custom',
          execution_status: 'success',
          page_path: window.location.pathname
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");

      // GTM Event: Code Execution Error
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'codeExecuted',
          language: currentLanguage,
          code_type: code === (currentLanguage === 'typescript' ? initialCode : initialCodePython) ? 'example' : 'custom',
          execution_status: 'error',
          page_path: window.location.pathname
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // GTM Event: Code Copied
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'codeCopied',
        language: currentLanguage,
        code_snippet_type: title || 'playground',
        page_path: window.location.pathname
      });
    }
  };

  const handleReset = () => {
    if (currentLanguage === "typescript") {
      setTsCode(initialCode);
    } else {
      setPyCode(initialCodePython || "");
    }
    setOutput("");
    setError("");
  };

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`playground-${title}-${currentLanguage}`, code);
    }
    // Show saved indicator
    const savedIndicator = document.getElementById("saved-indicator");
    if (savedIndicator) {
      savedIndicator.classList.remove("opacity-0");
      setTimeout(() => {
        savedIndicator.classList.add("opacity-0");
      }, 2000);
    }
  };

  const handleLanguageSwitch = (lang: "typescript" | "python") => {
    setCurrentLanguage(lang);
    setOutput("");
    setError("");
  };

  // Load saved code on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTs = localStorage.getItem(`playground-${title}-typescript`);
      const savedPy = localStorage.getItem(`playground-${title}-python`);
      if (savedTs) {
        setTsCode(savedTs);
      }
      if (savedPy) {
        setPyCode(savedPy);
      }
    }
  }, [title]);

  return (
      <div className="w-full">
        {title && (
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-black mb-2">{title}</h3>
              {description && <p className="text-black text-sm">{description}</p>}
            </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {/* Code Editor */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              {/* Left: title + language toggle (unchanged) */}
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-medium text-black">Code Editor</h4>
                {showLanguageToggle && initialCodePython && (
                    <div className="flex gap-1 bg-gray-800 rounded-md p-1">
                      <button
                          onClick={() => handleLanguageSwitch("typescript")}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              currentLanguage === "typescript"
                                  ? "bg-purple-600 text-white"
                                  : "text-white hover:text-white"
                          }`}
                      >
                        TypeScript
                      </button>
                      <button
                          onClick={() => handleLanguageSwitch("python")}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              currentLanguage === "python"
                                  ? "bg-purple-600 text-white"
                                  : "text-white hover:text-white"
                          }`}
                      >
                        Python
                      </button>
                    </div>
                )}
              </div>

              {/* Right: wallet button (left) + icon buttons (right) */}
              <div className="flex items-center gap-2">
                {/* Wallet button — compact width, truncates address */}
                {!hideWalletButton && (
                    currentLanguage === "typescript" ? (
                        <Button
                            onClick={connectMetaMask}
                            disabled={isConnecting || !!walletAddress}
                            variant={walletAddress ? "secondary" : "outline"}
                            className="h-8 px-2 min-w-[120px] max-w-[220px] md:max-w-[260px] overflow-hidden"
                            aria-label={
                              walletAddress ? "Wallet connected" : "Connect MetaMask"
                            }
                            title={walletAddress || "Connect MetaMask"}
                        >
                          {isConnecting ? (
                              <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Connecting…</span>
                      </span>
                          ) : walletAddress ? (
                              <span className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-xs truncate">
                          {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                        </span>
                      </span>
                          ) : (
                              <span className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 shrink-0" />
                        <span className="text-xs truncate">Connect Wallet</span>
                      </span>
                          )}
                        </Button>
                    ) : (
                        <div
                            className="hidden sm:flex items-center gap-2 px-2 h-8 bg-gray-800 rounded-lg border border-gray-700 text-white text-xs"
                            title="MetaMask runs in browser (TypeScript only)"
                        >
                          <Wallet className="h-4 w-4" />
                          <span className="truncate">TS-only wallet</span>
                        </div>
                    )
                )}

                {/* Icon actions */}
                {!hideSaveButton && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSave}
                        className="h-8"
                        aria-label="Save"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-8"
                    aria-label="Copy"
                >
                  {copied ? (
                      <Check className="h-4 w-4" />
                  ) : (
                      <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleReset}
                    className="h-8"
                    aria-label="Reset"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRun}
                    disabled={isRunning || disabled}
                    className={`h-8 ${!disabled && !isRunning ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                    aria-label="Run"
                    title={disabled ? (disabledMessage || "Disabled") : "Run (Ctrl/Cmd + Enter)"}
                >
                  {isRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                      <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <CodeMirror
                  value={code}
                  height="400px"
                  theme={oneDark}
                  extensions={[
                    currentLanguage === "typescript"
                        ? javascript({ typescript: true })
                        : python(),
                  ]}
                  onChange={(value) => setCode(value)}
                  className="text-sm"
              />
            </div>
          </div>

          {/* Output */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-black">Output</h4>
              <div
                  id="saved-indicator"
                  className="text-sm text-green-500 opacity-0 transition-opacity"
              >
                Saved!
              </div>
            </div>

            <div className="border border-gray-700 rounded-lg bg-gray-900 p-4 min-h-[160px] max-h-[260px] overflow-auto">
              {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}

              {output ? (
                  <pre className="text-sm text-white font-mono whitespace-pre-wrap">
                {output}
              </pre>
              ) : (
                  !error &&
                  !isRunning && (
                      <p className="text-white text-sm">
                        Click "Run Code" to execute your code
                      </p>
                  )
              )}

              {isRunning && (
                  <div className="flex items-center gap-2 text-white">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Executing...</span>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
