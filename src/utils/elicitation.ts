import { getServerRef } from './server-ref.js';
import { logger } from './logger.js';

export async function elicitSelection(
  prompt: string,
  choices: string[],
  defaultChoice?: string
): Promise<string | null> {
  try {
    const server = getServerRef();
    if (!server) return null;

    // TODO: Implement elicitation infrastructure when server-ref pattern is established
    // For now, return default or first choice
    logger.debug('Elicitation requested but not yet implemented', { prompt, choices, defaultChoice });
    return defaultChoice || choices[0] || null;
  } catch (error) {
    logger.debug('Elicitation failed', { error: (error as Error).message });
    return null;
  }
}

export async function elicitText(prompt: string, defaultValue?: string): Promise<string | null> {
  try {
    const server = getServerRef();
    if (!server) return null;

    logger.debug('Text elicitation requested but not yet implemented', { prompt, defaultValue });
    return defaultValue || null;
  } catch (error) {
    logger.debug('Text elicitation failed', { error: (error as Error).message });
    return null;
  }
}

export async function elicitConfirmation(prompt: string, defaultValue = false): Promise<boolean | null> {
  try {
    const server = getServerRef();
    if (!server) return null;

    logger.debug('Confirmation elicitation requested but not yet implemented', { prompt, defaultValue });
    return defaultValue;
  } catch (error) {
    logger.debug('Confirmation elicitation failed', { error: (error as Error).message });
    return null;
  }
}