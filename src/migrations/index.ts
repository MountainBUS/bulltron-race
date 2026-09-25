import * as migration_20260913_115141_initial from './20260913_115141_initial';
import * as migration_20260913_123612_logo_und_footer from './20260913_123612_logo_und_footer';
import * as migration_20260913_130223_hero_hintergrund from './20260913_130223_hero_hintergrund';
import * as migration_20260913_173555_haendler from './20260913_173555_haendler';
import * as migration_20260914_105757_kategorie_zuweisung from './20260914_105757_kategorie_zuweisung';
import * as migration_20260914_125405_preisliste_082026 from './20260914_125405_preisliste_082026';
import * as migration_20260914_125701_erreichbarkeit from './20260914_125701_erreichbarkeit';
import * as migration_20260914_144854_lieferzeit_felder from './20260914_144854_lieferzeit_felder';
import * as migration_20260914_150322_rennteams from './20260914_150322_rennteams';
import * as migration_20260918_130543_verkaeufer_hinweis from './20260918_130543_verkaeufer_hinweis';
import * as migration_20260925_074500_fahrer_am_fahrzeug from './20260925_074500_fahrer_am_fahrzeug';

export const migrations = [
  {
    up: migration_20260913_115141_initial.up,
    down: migration_20260913_115141_initial.down,
    name: '20260913_115141_initial',
  },
  {
    up: migration_20260913_123612_logo_und_footer.up,
    down: migration_20260913_123612_logo_und_footer.down,
    name: '20260913_123612_logo_und_footer',
  },
  {
    up: migration_20260913_130223_hero_hintergrund.up,
    down: migration_20260913_130223_hero_hintergrund.down,
    name: '20260913_130223_hero_hintergrund',
  },
  {
    up: migration_20260913_173555_haendler.up,
    down: migration_20260913_173555_haendler.down,
    name: '20260913_173555_haendler',
  },
  {
    up: migration_20260914_105757_kategorie_zuweisung.up,
    down: migration_20260914_105757_kategorie_zuweisung.down,
    name: '20260914_105757_kategorie_zuweisung',
  },
  {
    up: migration_20260914_125405_preisliste_082026.up,
    down: migration_20260914_125405_preisliste_082026.down,
    name: '20260914_125405_preisliste_082026',
  },
  {
    up: migration_20260914_125701_erreichbarkeit.up,
    down: migration_20260914_125701_erreichbarkeit.down,
    name: '20260914_125701_erreichbarkeit',
  },
  {
    up: migration_20260914_144854_lieferzeit_felder.up,
    down: migration_20260914_144854_lieferzeit_felder.down,
    name: '20260914_144854_lieferzeit_felder',
  },
  {
    up: migration_20260914_150322_rennteams.up,
    down: migration_20260914_150322_rennteams.down,
    name: '20260914_150322_rennteams',
  },
  {
    up: migration_20260918_130543_verkaeufer_hinweis.up,
    down: migration_20260918_130543_verkaeufer_hinweis.down,
    name: '20260918_130543_verkaeufer_hinweis'
  },
  {
    up: migration_20260925_074500_fahrer_am_fahrzeug.up,
    down: migration_20260925_074500_fahrer_am_fahrzeug.down,
    name: '20260925_074500_fahrer_am_fahrzeug'
  },
];
