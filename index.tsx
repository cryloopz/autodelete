/*
 * Plugin AutoDelete - Apaga suas mensagens com comando no chat
 * Digite: autodelete 10s, autodelete 1m, autodelete off, autodelete status
 * Melhorias: delay mínimo 1s, listar mensagens, cancelar, pausar
 */

import definePlugin from "@utils/types";
import { UserStore, Toasts, FluxDispatcher } from "@webpack/common";
import { Logger } from "@utils/Logger";

const logger = new Logger("AutoDelete");

// ===== TOKEN MANUAL =====
let cachedToken: string | null = null;

function setToken(token: string) {
    if (token && token.length > 20) {
        cachedToken = token;
        (window as any).__DISCORD_TOKEN__ = token;
        Toasts.show({
            message: "✅ Token definido!",
            id: Toasts.genId(),
            type: Toasts.Type.SUCCESS
        });
    }
}

function getToken(): string | null {
    return cachedToken || (window as any).__DISCORD_TOKEN__ || null;
}

// ===== VARIÁVEIS =====
interface ScheduledMessage {
    timer: NodeJS.Timeout;
    channelId: string;
    content: string;
    timestamp: number;
}

let activeTimers: Map<string, ScheduledMessage> = new Map();
let enabled = false;
let paused = false;
let delay = 10;

// ===== FUNÇÃO PARA CONVERTER TEMPO =====
function parseTime(input: string): number | null {
    const match = input.match(/^(\d+)(s|m|seg|min)?$/i);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2]?.toLowerCase() || 's';

    if (value <= 0) return null;

    switch (unit) {
        case 's':
        case 'seg':
            return value;
        case 'm':
        case 'min':
            return value * 60;
        default:
            return value;
    }
}

function formatTime(seconds: number): string {
    if (seconds >= 60) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}m${secs}s` : `${mins}m`;
    }
    return `${seconds}s`;
}

// ===== FUNÇÃO DE DELETAR =====
async function deleteMessage(channelId: string, messageId: string) {
    const token = getToken();
    if (!token) {
        logger.error("Token não definido!");
        return;
    }

    try {
        const response = await fetch(`/api/v9/channels/${channelId}/messages/${messageId}`, {
            method: "DELETE",
            headers: { "Authorization": token }
        });

        if (response.ok) {
            logger.info(`🗑️ Mensagem apagada: ${messageId}`);
        } else if (response.status === 403) {
            logger.info(`⏳ Mensagem muito antiga (${messageId})`);
        } else {
            logger.error(`Erro ${response.status} ao apagar ${messageId}`);
        }
    } catch (e) {
        logger.error("Erro:", e);
    }
}

// ===== FUNÇÃO PARA AGENDAR DELEÇÃO =====
function scheduleDelete(messageId: string, channelId: string, content: string = "") {
    if (activeTimers.has(messageId)) {
        clearTimeout(activeTimers.get(messageId)?.timer);
        activeTimers.delete(messageId);
    }

    if (paused) {
        logger.info(`⏸️ Mensagem ${messageId} aguardando (pausado)`);
        return;
    }

    const timer = setTimeout(() => {
        deleteMessage(channelId, messageId);
        activeTimers.delete(messageId);
    }, delay * 1000);

    activeTimers.set(messageId, {
        timer,
        channelId,
        content: content.substring(0, 30) + (content.length > 30 ? "..." : ""),
        timestamp: Date.now()
    });

    logger.info(`⏳ Mensagem será apagada em ${formatTime(delay)}`);
}

// ===== PROCESSAR COMANDOS NO CHAT =====
function processCommand(content: string) {
    const parts = content.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();

    if (command === "autodelete" || command === "ad") {
        const args = parts.slice(1);

        if (args.length === 0) {
            Toasts.show({
                message: `📌 AutoDelete: ${enabled ? "✅ Ativo" : "❌ Inativo"}${paused ? " ⏸️ Pausado" : ""} - ${formatTime(delay)} | ${activeTimers.size} agendadas`,
                id: Toasts.genId(),
                type: Toasts.Type.INFO
            });
            return true;
        }

        const arg = args[0]?.toLowerCase();

        if (arg === "off" || arg === "desativar") {
            enabled = false;
            paused = false;
            for (const [id, data] of activeTimers) {
                clearTimeout(data.timer);
                activeTimers.delete(id);
            }
            Toasts.show({
                message: "❌ AutoDelete desativado!",
                id: Toasts.genId(),
                type: Toasts.Type.FAILURE
            });
            return true;
        }

        if (arg === "status") {
            Toasts.show({
                message: `📌 ${enabled ? "✅ Ativo" : "❌ Inativo"}${paused ? " ⏸️ Pausado" : ""} - ${formatTime(delay)} | ${activeTimers.size} mensagens agendadas`,
                id: Toasts.genId(),
                type: Toasts.Type.INFO
            });
            return true;
        }

        if (arg === "on" || arg === "ativar") {
            enabled = true;
            paused = false;
            Toasts.show({
                message: `✅ AutoDelete ativado! ${formatTime(delay)}`,
                id: Toasts.genId(),
                type: Toasts.Type.SUCCESS
            });
            return true;
        }

        if (arg === "pause" || arg === "pausar") {
            paused = true;
            Toasts.show({
                message: "⏸️ AutoDelete pausado! Use 'autodelete resume' para continuar",
                id: Toasts.genId(),
                type: Toasts.Type.INFO
            });
            return true;
        }

        if (arg === "resume" || arg === "continuar") {
            paused = false;
            Toasts.show({
                message: "▶️ AutoDelete retomado!",
                id: Toasts.genId(),
                type: Toasts.Type.SUCCESS
            });
            return true;
        }

        if (arg === "list" || arg === "lista") {
            if (activeTimers.size === 0) {
                Toasts.show({
                    message: "📌 Nenhuma mensagem agendada",
                    id: Toasts.genId(),
                    type: Toasts.Type.INFO
                });
                return true;
            }

            let list = "📋 Mensagens agendadas:\n";
            let count = 0;
            for (const [id, data] of activeTimers) {
                count++;
                const timeLeft = Math.max(0, Math.ceil(((data.timestamp + delay * 1000) - Date.now()) / 1000));
                list += `${count}. ${data.content || "Mensagem"} - ${formatTime(timeLeft)} restante\n`;
                if (count >= 5) {
                    list += `... e mais ${activeTimers.size - 5} mensagens`;
                    break;
                }
            }

            Toasts.show({
                message: list,
                id: Toasts.genId(),
                type: Toasts.Type.INFO
            });
            return true;
        }

        if (arg === "clear" || arg === "limpar") {
            for (const [id, data] of activeTimers) {
                clearTimeout(data.timer);
                activeTimers.delete(id);
            }
            Toasts.show({
                message: "🧹 Todas as mensagens agendadas foram canceladas!",
                id: Toasts.genId(),
                type: Toasts.Type.SUCCESS
            });
            return true;
        }

        const seconds = parseTime(arg);
        if (seconds !== null && seconds >= 1 && seconds <= 3600) {
            delay = seconds;
            Toasts.show({
                message: `⏱️ Delay alterado para ${formatTime(delay)}`,
                id: Toasts.genId(),
                type: Toasts.Type.SUCCESS
            });
            return true;
        } else if (seconds !== null) {
            Toasts.show({
                message: "❌ Delay deve ser entre 1s e 60m",
                id: Toasts.genId(),
                type: Toasts.Type.FAILURE
            });
            return true;
        }

        Toasts.show({
            message: "📌 Comandos: autodelete [on/off/status/10s/1m/list/pause/resume/clear]",
            id: Toasts.genId(),
            type: Toasts.Type.INFO
        });
        return true;
    }

    return false;
}

// ===== PLUGIN =====
export default definePlugin({
    name: "autodelete",
    description: "Apaga suas mensagens com comando no chat (autodelete 10s, 1m, etc)",
    authors: [{ name: "l1wn", id: 0n }],

    flux: {
        MESSAGE_CREATE({ message }) {
            if (!message) return;
            if (message.author.id !== UserStore.getCurrentUser().id) return;

            const content = message.content?.trim() || "";

            if (processCommand(content)) {
                FluxDispatcher.dispatch({
                    type: "MESSAGE_DELETE",
                    channelId: message.channel_id,
                    messageId: message.id
                });
                return;
            }

            if (enabled && !paused) {
                scheduleDelete(message.id, message.channel_id, content);
            }
        }
    },

    start() {
        (window as any).autoDelete = {
            setToken: setToken,
            setDelay: (seconds: number) => {
                if (seconds >= 1 && seconds <= 3600) {
                    delay = seconds;
                    Toasts.show({
                        message: `⏱️ Delay: ${formatTime(delay)}`,
                        id: Toasts.genId(),
                        type: Toasts.Type.SUCCESS
                    });
                } else {
                    Toasts.show({
                        message: "❌ Entre 1s e 3600s (1 hora)",
                        id: Toasts.genId(),
                        type: Toasts.Type.FAILURE
                    });
                }
            },
            toggle: () => {
                enabled = !enabled;
                if (!enabled) {
                    paused = false;
                    for (const [id, data] of activeTimers) {
                        clearTimeout(data.timer);
                        activeTimers.delete(id);
                    }
                }
                Toasts.show({
                    message: enabled ? "✅ Ativado!" : "❌ Desativado!",
                    id: Toasts.genId(),
                    type: enabled ? Toasts.Type.SUCCESS : Toasts.Type.FAILURE
                });
            },
            pause: () => {
                paused = true;
                Toasts.show({
                    message: "⏸️ Pausado!",
                    id: Toasts.genId(),
                    type: Toasts.Type.INFO
                });
            },
            resume: () => {
                paused = false;
                Toasts.show({
                    message: "▶️ Retomado!",
                    id: Toasts.genId(),
                    type: Toasts.Type.SUCCESS
                });
            },
            status: () => {
                Toasts.show({
                    message: `📌 ${enabled ? "✅ Ativo" : "❌ Inativo"}${paused ? " ⏸️ Pausado" : ""} - ${formatTime(delay)} | ${activeTimers.size} agendadas`,
                    id: Toasts.genId(),
                    type: Toasts.Type.INFO
                });
            },
            check: () => {
                const token = getToken();
                Toasts.show({
                    message: token ? "✅ Token definido!" : "❌ Token não definido! Use: autoDelete.setToken('TOKEN')",
                    id: Toasts.genId(),
                    type: token ? Toasts.Type.SUCCESS : Toasts.Type.FAILURE
                });
                return token;
            }
        };

        const token = getToken();
        if (token) {
            logger.info("✅ Token encontrado!");
        } else {
            logger.warn("⚠️ Token não definido! Use: autoDelete.setToken('SEU_TOKEN')");
        }

        logger.info("✅ AutoDelete iniciado!");
        logger.info("📌 Comandos: autodelete [on/off/status/10s/1m/list/pause/resume/clear]");

        Toasts.show({
            message: "🧹 AutoDelete! Digite 'autodelete 10s' para configurar",
            id: Toasts.genId(),
            type: Toasts.Type.INFO
        });
    },

    stop() {
        for (const [id, data] of activeTimers) {
            clearTimeout(data.timer);
            activeTimers.delete(id);
        }
        delete (window as any).autoDelete;
        logger.info("❌ AutoDelete desativado!");
    }
});