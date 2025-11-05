import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../db';

export interface BrandingAttributes {
  id: string;
  userId: string;
  logo?: string; // URL ou base64
  primaryColor: string;
  secondaryColor: string;
  headerText?: string;
  footerText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingCreationAttributes
  extends Optional<BrandingAttributes, 'id' | 'logo' | 'headerText' | 'footerText' | 'createdAt' | 'updatedAt'> {}

export class Branding
  extends Model<BrandingAttributes, BrandingCreationAttributes>
  implements BrandingAttributes
{
  declare id: string;
  declare userId: string;
  declare logo?: string;
  declare primaryColor: string;
  declare secondaryColor: string;
  declare headerText?: string;
  declare footerText?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Branding.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // Um usuário tem apenas uma configuração de branding
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    logo: {
      type: DataTypes.TEXT, // URL ou base64
      allowNull: true,
    },
    primaryColor: {
      type: DataTypes.STRING(7), // Formato #RRGGBB
      allowNull: false,
      defaultValue: '#2f2c79', // Cor padrão Qivo
      validate: {
        is: /^#[0-9A-Fa-f]{6}$/,
      },
    },
    secondaryColor: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: '#b96e48', // Cor secundária padrão Qivo
      validate: {
        is: /^#[0-9A-Fa-f]{6}$/,
      },
    },
    headerText: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    footerText: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'branding',
    timestamps: true,
  }
);
