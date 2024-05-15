import { DEMOGRAPHICS } from "../../types";
import { Gender, Pronoun } from "../Gender";

export function parseGenderInput(input: string): Gender {
  const trimmedInput = input.trim().toLowerCase();

  switch (trimmedInput) {
    case "male":
    case "m":
      return Gender.MALE;
    case "female":
    case "f":
      return Gender.FEMALE;
    case "neutral":
    case "n":
      return Gender.NEUTRAL;
    default:
      return Gender.CUSTOM;
  }
}

export function getDemographicUUIDFromPronoun(pronoun: Pronoun): string {
  switch (pronoun) {
    case Pronoun.SUBJECTIVE:
      return DEMOGRAPHICS.SUBJECTIVE;
    case Pronoun.OBJECTIVE:
      return DEMOGRAPHICS.OBJECTIVE;
    case Pronoun.POSSESSIVE:
      return DEMOGRAPHICS.POSSESSIVE;
    case Pronoun.POSSESSIVE_ADJECTIVE:
      return DEMOGRAPHICS.POSSESSIVE_ADJ;
    case Pronoun.REFLEXIVE:
      return DEMOGRAPHICS.REFLEXIVE;
    default:
      throw new Error("Invalid Pronoun type for demographic mapping");
  }
}

export function isPronoun(value: any): value is Pronoun {
  return Object.values(Pronoun).includes(value);
}

export function getGenderPronoun(gender: Gender, pronounType: Pronoun): string | undefined {
  switch (gender) {
    case Gender.MALE:
      return getMalePronoun(pronounType);
    case Gender.FEMALE:
      return getFemalePronoun(pronounType);
    case Gender.NEUTRAL:
      return getNeutralPronoun(pronounType);
    default:
      return undefined;
  }
}

export function getPronounValue(abbreviatedPronounName: string, genderInputValue: string): string | undefined {
  if (!isPronoun(abbreviatedPronounName)) return;

  if (!genderInputValue || typeof genderInputValue !== "string") return;
  const gender = parseGenderInput(genderInputValue);
  const pronounValue = getGenderPronoun(gender, abbreviatedPronounName);
  return pronounValue;
}

function getMalePronoun(pronounType: Pronoun): string {
  switch (pronounType) {
    case Pronoun.SUBJECTIVE:
      return "he";
    case Pronoun.OBJECTIVE:
      return "him";
    case Pronoun.POSSESSIVE:
      return "his";
    case Pronoun.POSSESSIVE_ADJECTIVE:
      return "his";
    case Pronoun.REFLEXIVE:
      return "himself";
  }
}

function getFemalePronoun(pronounType: Pronoun): string {
  switch (pronounType) {
    case Pronoun.SUBJECTIVE:
      return "she";
    case Pronoun.OBJECTIVE:
      return "her";
    case Pronoun.POSSESSIVE:
      return "hers";
    case Pronoun.POSSESSIVE_ADJECTIVE:
      return "her";
    case Pronoun.REFLEXIVE:
      return "herself";
  }
}

function getNeutralPronoun(pronounType: Pronoun): string {
  switch (pronounType) {
    case Pronoun.SUBJECTIVE:
      return "they";
    case Pronoun.OBJECTIVE:
      return "them";
    case Pronoun.POSSESSIVE:
      return "theirs";
    case Pronoun.POSSESSIVE_ADJECTIVE:
      return "their";
    case Pronoun.REFLEXIVE:
      return "themself";
  }
}
