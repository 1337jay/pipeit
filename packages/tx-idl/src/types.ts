/**
 * IDL type definitions for Solana programs.
 * Based on standard Anchor/Codama IDL JSON format.
 *
 * @packageDocumentation
 */

/**
 * Root IDL structure for a Solana program.
 */
export interface ProgramIdl {
  /**
   * IDL version.
   */
  version: string;

  /**
   * Program name.
   */
  name: string;

  /**
   * List of instructions exposed by the program.
   */
  instructions: IdlInstruction[];

  /**
   * Account type definitions (optional).
   */
  accounts?: IdlAccountDef[];

  /**
   * Type definitions for complex types (structs, enums, etc.).
   */
  types?: IdlTypeDef[];

  /**
   * Error code definitions.
   */
  errors?: IdlErrorCode[];

  /**
   * Program metadata.
   */
  metadata?: {
    /**
     * Program address.
     */
    address: string;
  };
}

/**
 * Instruction definition in IDL.
 */
export interface IdlInstruction {
  /**
   * Instruction name (camelCase).
   */
  name: string;

  /**
   * Accounts required by this instruction.
   */
  accounts: IdlAccountItem[];

  /**
   * Instruction arguments/parameters.
   */
  args: IdlField[];

  /**
   * Discriminator for instruction (optional).
   * Used to identify the instruction variant.
   * Supports both single-byte format ({ type: "u8", value: 123 })
   * and Anchor-style 8-byte array format ({ type: "bytes", value: [1,2,3,4,5,6,7,8] }).
   */
  discriminant?:
    | {
        /**
         * Discriminator type ('u8' for single byte).
         */
        type: string;

        /**
         * Discriminator value (single byte).
         */
        value: number;
      }
    | {
        /**
         * Discriminator type ('bytes' for byte array).
         */
        type: 'bytes';

        /**
         * Discriminator value (8-byte array for Anchor format).
         */
        value: number[];
      };

  /**
   * Documentation strings.
   */
  docs?: string[];
}

/**
 * Account item in instruction definition.
 */
export interface IdlAccountItem {
  /**
   * Account name.
   */
  name: string;

  /**
   * Whether the account is mutable.
   * Not required for composite accounts (accounts with nested accounts).
   */
  isMut?: boolean;

  /**
   * Whether the account must be a signer.
   * Not required for composite accounts (accounts with nested accounts).
   */
  isSigner?: boolean;

  /**
   * Whether the account is optional.
   */
  isOptional?: boolean;

  /**
   * Documentation strings.
   */
  docs?: string[];

  /**
   * PDA derivation information (if account is a PDA).
   */
  pda?: {
    /**
     * Seeds for PDA derivation.
     */
    seeds: PdaSeed[];
  };

  /**
   * Nested accounts for composite account structures.
   * When present, this account is a group containing other accounts.
   */
  accounts?: IdlAccountItem[];
}

/**
 * PDA seed definition.
 */
export type PdaSeed =
  | { kind: 'const'; type: IdlType; value: unknown }
  | { kind: 'arg'; path: string }
  | { kind: 'account'; path: string; type?: IdlType };

/**
 * Field definition (for args or struct fields).
 */
export interface IdlField {
  /**
   * Field name.
   */
  name: string;

  /**
   * Field type.
   */
  type: IdlType;

  /**
   * Documentation strings.
   */
  docs?: string[];
}

/**
 * IDL type definition.
 * Can be a primitive type string or a complex type object.
 */
export type IdlType =
  // Primitive types
  | 'bool'
  | 'u8'
  | 'u16'
  | 'u32'
  | 'u64'
  | 'u128'
  | 'i8'
  | 'i16'
  | 'i32'
  | 'i64'
  | 'i128'
  | 'f32'
  | 'f64'
  | 'string'
  | 'publicKey'
  | 'bytes'
  // Complex types
  | { vec: IdlType }
  | { option: IdlType }
  | { array: [IdlType, number] }
  | { defined: string }
  | { coption?: IdlType }
  | { tuple: IdlType[] };

/**
 * Account type definition.
 */
export interface IdlAccountDef {
  /**
   * Account type name.
   */
  name: string;

  /**
   * Account type structure.
   */
  type: {
    kind: 'struct' | 'enum';
    fields?: IdlField[];
    variants?: IdlEnumVariant[];
  };

  /**
   * Documentation strings.
   */
  docs?: string[];
}

/**
 * Enum variant definition.
 */
export interface IdlEnumVariant {
  /**
   * Variant name.
   */
  name: string;

  /**
   * Variant fields (if any).
   */
  fields?: IdlField[];

  /**
   * Documentation strings.
   */
  docs?: string[];
}

/**
 * Type definition for complex types.
 */
export interface IdlTypeDef {
  /**
   * Type name.
   */
  name: string;

  /**
   * Type definition.
   */
  type: {
    kind: 'struct' | 'enum';
    fields?: IdlField[];
    variants?: IdlEnumVariant[];
  };

  /**
   * Documentation strings.
   */
  docs?: string[];
}

/**
 * Error code definition.
 */
export interface IdlErrorCode {
  /**
   * Error code number.
   */
  code: number;

  /**
   * Error name.
   */
  name: string;

  /**
   * Error message.
   */
  msg: string;
}

