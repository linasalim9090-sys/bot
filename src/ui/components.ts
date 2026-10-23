import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonStyle,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { assertNoEmoji } from './emoji.js';
import { LIMITS, UiLimitError } from './limits.js';

export interface BotButtonInput {
  customId: string;
  label: string;
  style: ButtonStyle;
  disabled?: boolean;
}

export function createButton(input: BotButtonInput): ButtonBuilder {
  if (input.customId.length > LIMITS.customId) {
    throw new UiLimitError(`Button customId exceeds limit of ${LIMITS.customId} characters.`);
  }

  if (input.label.length > LIMITS.buttonLabel) {
    throw new UiLimitError(`Button label exceeds limit of ${LIMITS.buttonLabel} characters.`);
  }

  if (process.env.NODE_ENV !== 'production') {
    assertNoEmoji(input.label);
  }

  const button = new ButtonBuilder()
    .setCustomId(input.customId)
    .setLabel(input.label)
    .setStyle(input.style);

  if (input.disabled !== undefined) {
    button.setDisabled(input.disabled);
  }

  return button;
}

export interface BotSelectOption {
  label: string;
  value: string;
  description?: string;
  default?: boolean;
}

export interface BotSelectInput {
  customId: string;
  options: BotSelectOption[];
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
}

export function createSelectMenu(input: BotSelectInput): StringSelectMenuBuilder {
  if (input.customId.length > LIMITS.customId) {
    throw new UiLimitError(`Select customId exceeds limit of ${LIMITS.customId} characters.`);
  }

  if (input.options.length > LIMITS.selectOptions) {
    throw new UiLimitError(`Select options exceed limit of ${LIMITS.selectOptions}.`);
  }

  if (input.placeholder && process.env.NODE_ENV !== 'production') {
    assertNoEmoji(input.placeholder);
  }

  const select = new StringSelectMenuBuilder().setCustomId(input.customId);

  if (input.placeholder) {
    select.setPlaceholder(input.placeholder);
  }
  if (input.minValues !== undefined) {
    select.setMinValues(input.minValues);
  }
  if (input.maxValues !== undefined) {
    select.setMaxValues(input.maxValues);
  }
  if (input.disabled !== undefined) {
    select.setDisabled(input.disabled);
  }

  const options = input.options.map((opt) => {
    if (opt.label.length > LIMITS.selectLabel) {
      throw new UiLimitError(`Option label exceeds limit of ${LIMITS.selectLabel} characters.`);
    }
    if (opt.description && opt.description.length > LIMITS.selectDescription) {
      throw new UiLimitError(
        `Option description exceeds limit of ${LIMITS.selectDescription} characters.`,
      );
    }
    if (process.env.NODE_ENV !== 'production') {
      assertNoEmoji(opt.label);
      if (opt.description) assertNoEmoji(opt.description);
    }

    return {
      label: opt.label,
      value: opt.value,
      description: opt.description,
      default: opt.default,
    };
  });

  select.addOptions(options);
  return select;
}

export interface BotModalFieldInput {
  customId: string;
  label: string;
  style?: TextInputStyle;
  placeholder?: string;
  value?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export interface BotModalInput {
  customId: string;
  title: string;
  inputs: BotModalFieldInput[];
}

export function createModal(input: BotModalInput): ModalBuilder {
  if (input.customId.length > LIMITS.customId) {
    throw new UiLimitError(`Modal customId exceeds limit of ${LIMITS.customId} characters.`);
  }

  if (input.title.length > LIMITS.modalTitle) {
    throw new UiLimitError(`Modal title exceeds limit of ${LIMITS.modalTitle} characters.`);
  }

  if (input.inputs.length > LIMITS.modalInputs) {
    throw new UiLimitError(`Modal cannot have more than ${LIMITS.modalInputs} inputs.`);
  }

  if (process.env.NODE_ENV !== 'production') {
    assertNoEmoji(input.title);
  }

  const modal = new ModalBuilder().setCustomId(input.customId).setTitle(input.title);

  for (const field of input.inputs) {
    if (field.label.length > LIMITS.modalLabel) {
      throw new UiLimitError(`Modal field label exceeds limit of ${LIMITS.modalLabel} characters.`);
    }
    if (field.placeholder && field.placeholder.length > LIMITS.modalPlaceholder) {
      throw new UiLimitError(
        `Modal field placeholder exceeds limit of ${LIMITS.modalPlaceholder} characters.`,
      );
    }
    if (field.value && field.value.length > LIMITS.modalValue) {
      throw new UiLimitError(`Modal field value exceeds limit of ${LIMITS.modalValue} characters.`);
    }
    if (process.env.NODE_ENV !== 'production') {
      assertNoEmoji(field.label);
      if (field.placeholder) assertNoEmoji(field.placeholder);
      if (field.value) assertNoEmoji(field.value);
    }

    const textInput = new TextInputBuilder()
      .setCustomId(field.customId)
      .setLabel(field.label)
      .setStyle(field.style ?? TextInputStyle.Short);

    if (field.placeholder) textInput.setPlaceholder(field.placeholder);
    if (field.value) textInput.setValue(field.value);
    if (field.required !== undefined) textInput.setRequired(field.required);
    if (field.minLength !== undefined) textInput.setMinLength(field.minLength);
    if (field.maxLength !== undefined) textInput.setMaxLength(field.maxLength);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
    modal.addComponents(row);
  }

  return modal;
}
