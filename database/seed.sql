-- IronPlan Mini — Seed Data
-- County jail: Lincoln County Detention Center
-- Run this AFTER schema.sql
--
-- Facility UUID is fixed so VITE_FACILITY_ID can reference it in .env.local:
--   VITE_FACILITY_ID=11111111-1111-1111-1111-111111111111

-- ─────────────────────────────────────────────
-- FACILITY
-- ─────────────────────────────────────────────
INSERT INTO facilities (id, name, address, county, state, capacity) VALUES
  ('11111111-1111-1111-1111-111111111111',
   'Lincoln County Detention Center',
   '400 Justice Drive, Springfield, IL 62701',
   'Lincoln', 'IL', 312);

-- ─────────────────────────────────────────────
-- ROOMS  (names must match FloorPlan.jsx ROOM_SHAPES)
-- ─────────────────────────────────────────────
INSERT INTO rooms (id, facility_id, name, room_type, floor) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Sally Port',   'sally_port', 1),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Intake',        'intake',     1),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'Control Room',  'control',    1),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 'Cell Block A',  'cell_block', 1),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111', 'Cell Block B',  'cell_block', 1),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111111', 'Medical',       'medical',    1),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111111', 'Visitation',    'visitation', 1);

-- ─────────────────────────────────────────────
-- EQUIPMENT
-- Condition scores: 1=Critical  2=Poor  3=Fair  4=Good  5=Excellent
-- ─────────────────────────────────────────────

-- ── Sally Port ────────────────────────────────────────────────────────────
INSERT INTO equipment
  (room_id, name, type, condition_score, last_inspected, replacement_cost, manufacturer, install_year, notes)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'Outer Vehicle Gate',          'door',     2, '2023-08-14', 38500.00,  'Delta Scientific',    2009, 'Hydraulic ram shows rust; actuator seal leaking'),
  ('22222222-2222-2222-2222-222222222201', 'Inner Vehicle Gate',          'door',     4, '2024-11-02', 38500.00,  'Delta Scientific',    2016, NULL),
  ('22222222-2222-2222-2222-222222222201', 'Pedestrian Entry Door',       'door',     3, '2024-06-20', 4200.00,   'Norment Security',    2014, 'Frame hairline crack near lower hinge'),
  ('22222222-2222-2222-2222-222222222201', 'Vehicle Intercom Station',    'intercom', 1, '2022-03-10', 2800.00,   'Aiphone',             2010, 'Speaker distorted; unit fails intermittently in cold weather'),
  ('22222222-2222-2222-2222-222222222201', 'CCTV Mount — Gate Exterior',  'camera',   4, '2025-01-15', 1400.00,   'Axis Communications', 2020, NULL),
  ('22222222-2222-2222-2222-222222222201', 'Access Control Panel — SP',   'alarm',    3, '2024-09-01', 5100.00,   'Honeywell',           2015, 'Card reader intermittently rejects valid credentials');

-- ── Intake ────────────────────────────────────────────────────────────────
INSERT INTO equipment
  (room_id, name, type, condition_score, last_inspected, replacement_cost, manufacturer, install_year, notes)
VALUES
  ('22222222-2222-2222-2222-222222222202', 'Holding Cell Door #1',        'door',     1, '2022-09-30', 9800.00,   'Folger Adam',         2007, 'Latch mechanism stripped; door requires manual assist to close'),
  ('22222222-2222-2222-2222-222222222202', 'Holding Cell Door #2',        'door',     3, '2024-05-12', 9800.00,   'Folger Adam',         2013, NULL),
  ('22222222-2222-2222-2222-222222222202', 'Booking Counter Door',        'door',     4, '2024-10-28', 3600.00,   'Norment Security',    2018, NULL),
  ('22222222-2222-2222-2222-222222222202', 'Fingerprint Scanner Unit',    'other',    5, '2025-02-03', 7200.00,   'Suprema',             2022, NULL),
  ('22222222-2222-2222-2222-222222222202', 'Property Storage Deadbolt #1','lock',     2, '2023-11-14', 620.00,    'Folger Adam',         2009, 'Cylinder worn; key sticks on extraction'),
  ('22222222-2222-2222-2222-222222222202', 'Property Storage Deadbolt #2','lock',     4, '2024-07-19', 620.00,    'Folger Adam',         2018, NULL),
  ('22222222-2222-2222-2222-222222222202', 'Intake Intercom Panel',       'intercom', 3, '2024-04-22', 2200.00,   'Aiphone',             2016, 'Volume knob broken; volume fixed at 60%'),
  ('22222222-2222-2222-2222-222222222202', 'CCTV Mount — Intake Lobby',   'camera',   4, '2025-01-10', 1300.00,   'Hikvision',           2021, NULL),
  ('22222222-2222-2222-2222-222222222202', 'Panic Button — Booking Desk', 'alarm',    5, '2025-03-01', 480.00,    'Bosch',               2023, NULL);

-- ── Control Room ──────────────────────────────────────────────────────────
INSERT INTO equipment
  (room_id, name, type, condition_score, last_inspected, replacement_cost, manufacturer, install_year, notes)
VALUES
  ('22222222-2222-2222-2222-222222222203', 'Master Control Panel',        'other',    2, '2023-06-05', 74000.00,  'Norment Security',    2006, 'Multiple relay contacts corroded; vendor quoted full board replacement'),
  ('22222222-2222-2222-2222-222222222203', 'CCTV Monitor Array (16-ch)',  'camera',   4, '2024-12-10', 8400.00,   'Pelco',               2019, NULL),
  ('22222222-2222-2222-2222-222222222203', 'Radio Console',               'intercom', 3, '2024-08-22', 11500.00,  'Motorola Solutions',  2015, 'Channel selector worn; occasional signal drop on CH-3'),
  ('22222222-2222-2222-2222-222222222203', 'Duress Alarm Panel',          'alarm',    5, '2025-03-15', 3900.00,   'Bosch',               2022, NULL),
  ('22222222-2222-2222-2222-222222222203', 'Emergency Override Panel',    'alarm',    4, '2024-11-20', 6200.00,   'Honeywell',           2018, NULL),
  ('22222222-2222-2222-2222-222222222203', 'Key Control Cabinet',         'lock',     3, '2024-06-30', 4800.00,   'Kidde',               2014, '3 key hooks broken; cabinet door hinge squeaks'),
  ('22222222-2222-2222-2222-222222222203', 'Intercom Hub — Central',      'intercom', 4, '2025-01-08', 5500.00,   'Aiphone',             2019, NULL),
  ('22222222-2222-2222-2222-222222222203', 'CCTV Mount — Control Entry',  'camera',   5, '2025-02-14', 1600.00,   'Axis Communications', 2023, NULL);

-- ── Cell Block A ──────────────────────────────────────────────────────────
INSERT INTO equipment
  (room_id, name, type, condition_score, last_inspected, replacement_cost, manufacturer, install_year, notes)
VALUES
  ('22222222-2222-2222-2222-222222222204', 'Sliding Cell Door A-01',      'door',     1, '2021-11-18', 13500.00,  'Folger Adam',         2005, 'Slide track fractured; door binds at 50% travel — immediate replacement needed'),
  ('22222222-2222-2222-2222-222222222204', 'Sliding Cell Door A-02',      'door',     2, '2023-04-07', 13500.00,  'Folger Adam',         2005, 'Track worn; operator reports slow close time > 6s'),
  ('22222222-2222-2222-2222-222222222204', 'Sliding Cell Door A-03',      'door',     3, '2024-03-19', 13500.00,  'Folger Adam',         2011, NULL),
  ('22222222-2222-2222-2222-222222222204', 'Sliding Cell Door A-04',      'door',     4, '2024-09-25', 13500.00,  'Folger Adam',         2016, NULL),
  ('22222222-2222-2222-2222-222222222204', 'Sliding Cell Door A-05',      'door',     4, '2024-09-25', 13500.00,  'Folger Adam',         2016, NULL),
  ('22222222-2222-2222-2222-222222222204', 'Hydraulic Door Operator A-01','door',     1, '2022-02-14', 18200.00,  'R&O Construction',    2005, 'Hydraulic fluid reservoir cracked; unit not operational'),
  ('22222222-2222-2222-2222-222222222204', 'Hydraulic Door Operator A-02','door',     3, '2024-05-30', 18200.00,  'R&O Construction',    2011, 'Pressure drops 15% over 30-min cycle'),
  ('22222222-2222-2222-2222-222222222204', 'Deadbolt Lock A-Block Entry', 'lock',     3, '2024-01-11', 980.00,    'Southern Steel',      2012, NULL),
  ('22222222-2222-2222-2222-222222222204', 'Intercom Panel A-Block',      'intercom', 2, '2023-07-08', 2400.00,   'Aiphone',             2009, 'PCB corroded; 4 of 8 call buttons non-functional'),
  ('22222222-2222-2222-2222-222222222204', 'CCTV Mount A-Block North',    'camera',   4, '2025-01-22', 1350.00,   'Hikvision',           2020, NULL),
  ('22222222-2222-2222-2222-222222222204', 'CCTV Mount A-Block South',    'camera',   3, '2024-04-14', 1350.00,   'Hikvision',           2017, 'Pan motor sluggish; auto-sweep disabled'),
  ('22222222-2222-2222-2222-222222222204', 'Emergency Call Button A-01',  'alarm',    3, '2024-02-28', 520.00,    'Bosch',               2013, NULL),
  ('22222222-2222-2222-2222-222222222204', 'Emergency Call Button A-02',  'alarm',    4, '2024-10-15', 520.00,    'Bosch',               2019, NULL),
  ('22222222-2222-2222-2222-222222222204', 'Panic Button A-Block Guard',  'alarm',    5, '2025-02-20', 480.00,    'Bosch',               2023, NULL),
  ('22222222-2222-2222-2222-222222222204', 'Window Bar Assembly A-01',    'other',    2, '2023-09-12', 3200.00,   'CHL Security',        2005, 'Two bars show surface corrosion; weld points need inspection');

-- ── Cell Block B ──────────────────────────────────────────────────────────
INSERT INTO equipment
  (room_id, name, type, condition_score, last_inspected, replacement_cost, manufacturer, install_year, notes)
VALUES
  ('22222222-2222-2222-2222-222222222205', 'Sliding Cell Door B-01',      'door',     3, '2024-06-03', 13500.00,  'Folger Adam',         2014, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Sliding Cell Door B-02',      'door',     3, '2024-06-03', 13500.00,  'Folger Adam',         2014, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Sliding Cell Door B-03',      'door',     4, '2024-11-07', 13500.00,  'Folger Adam',         2018, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Sliding Cell Door B-04',      'door',     5, '2025-01-30', 13500.00,  'Folger Adam',         2022, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Sliding Cell Door B-05',      'door',     4, '2024-11-07', 13500.00,  'Folger Adam',         2018, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Hydraulic Door Operator B-01','door',     4, '2024-12-01', 18200.00,  'R&O Construction',    2018, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Hydraulic Door Operator B-02','door',     5, '2025-02-28', 18200.00,  'R&O Construction',    2022, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Deadbolt Lock B-Block Entry', 'lock',     4, '2024-08-19', 980.00,    'Southern Steel',      2018, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Intercom Panel B-Block',      'intercom', 4, '2024-10-22', 2400.00,   'Aiphone',             2018, NULL),
  ('22222222-2222-2222-2222-222222222205', 'CCTV Mount B-Block North',    'camera',   5, '2025-01-25', 1350.00,   'Axis Communications', 2022, NULL),
  ('22222222-2222-2222-2222-222222222205', 'CCTV Mount B-Block South',    'camera',   4, '2024-12-18', 1350.00,   'Axis Communications', 2020, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Emergency Call Button B-01',  'alarm',    4, '2024-09-09', 520.00,    'Bosch',               2018, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Emergency Call Button B-02',  'alarm',    5, '2025-02-05', 520.00,    'Bosch',               2022, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Panic Button B-Block Guard',  'alarm',    4, '2024-11-14', 480.00,    'Bosch',               2020, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Window Bar Assembly B-01',    'other',    4, '2024-07-02', 3200.00,   'CHL Security',        2017, NULL);

-- ── Medical ───────────────────────────────────────────────────────────────
INSERT INTO equipment
  (room_id, name, type, condition_score, last_inspected, replacement_cost, manufacturer, install_year, notes)
VALUES
  ('22222222-2222-2222-2222-222222222206', 'Medical Bay Entry Door',      'door',     4, '2024-10-05', 4400.00,   'Norment Security',    2018, NULL),
  ('22222222-2222-2222-2222-222222222206', 'Medication Cabinet Lock',     'lock',     3, '2024-03-14', 1100.00,   'Kidde',               2014, 'Combination tumbler shows wear; rekeying overdue'),
  ('22222222-2222-2222-2222-222222222206', 'CCTV Mount — Medical',        'camera',   4, '2025-01-18', 1300.00,   'Hikvision',           2020, NULL),
  ('22222222-2222-2222-2222-222222222206', 'Panic Button — Medical Staff','alarm',    5, '2025-03-10', 480.00,    'Bosch',               2023, NULL),
  ('22222222-2222-2222-2222-222222222206', 'Intercom Panel — Medical',    'intercom', 3, '2024-02-20', 2200.00,   'Aiphone',             2015, 'Handset cradle cracked; taped in place');

-- ── Visitation ────────────────────────────────────────────────────────────
INSERT INTO equipment
  (room_id, name, type, condition_score, last_inspected, replacement_cost, manufacturer, install_year, notes)
VALUES
  ('22222222-2222-2222-2222-222222222207', 'Visitor Entry Door',          'door',     3, '2024-05-08', 4200.00,   'Norment Security',    2013, 'Closer spring weakened; door does not self-close fully'),
  ('22222222-2222-2222-2222-222222222207', 'Visitation Booth Door #1',    'door',     4, '2024-09-17', 3800.00,   'Norment Security',    2018, NULL),
  ('22222222-2222-2222-2222-222222222207', 'Visitation Booth Door #2',    'door',     4, '2024-09-17', 3800.00,   'Norment Security',    2018, NULL),
  ('22222222-2222-2222-2222-222222222207', 'Telephone Handset #1',        'intercom', 2, '2023-08-24', 380.00,    'Global Tel-Link',     2011, 'Handset cord frayed; audio cuts out when cord flexed'),
  ('22222222-2222-2222-2222-222222222207', 'Telephone Handset #2',        'intercom', 3, '2024-04-30', 380.00,    'Global Tel-Link',     2016, 'Volume low on inmate side'),
  ('22222222-2222-2222-2222-222222222207', 'Telephone Handset #3',        'intercom', 5, '2025-01-05', 380.00,    'Global Tel-Link',     2023, NULL),
  ('22222222-2222-2222-2222-222222222207', 'CCTV Mount — Visitation',     'camera',   4, '2024-12-20', 1300.00,   'Hikvision',           2020, NULL),
  ('22222222-2222-2222-2222-222222222207', 'Panic Button — Visitation',   'alarm',    4, '2024-11-28', 480.00,    'Bosch',               2020, NULL);

-- ─────────────────────────────────────────────
-- INSPECTIONS (recent history for a sample of equipment)
-- ─────────────────────────────────────────────
INSERT INTO inspections
  (equipment_id, inspected_by, inspected_at, condition_score, findings, action_required, action_notes)
SELECT id, 'J. Harmon',   '2021-11-18 09:15:00', 1,
  'Slide track fractured at mid-point. Door binds severely. Safety risk.',
  TRUE, 'Request emergency procurement. Tag door out of service.'
FROM equipment WHERE name = 'Sliding Cell Door A-01';

INSERT INTO inspections
  (equipment_id, inspected_by, inspected_at, condition_score, findings, action_required, action_notes)
SELECT id, 'M. Castillo', '2022-02-14 14:30:00', 1,
  'Hydraulic reservoir cracked. Unit non-operational. Manual override required.',
  TRUE, 'Isolate circuit. Submit capital request FY2023.'
FROM equipment WHERE name = 'Hydraulic Door Operator A-01';

INSERT INTO inspections
  (equipment_id, inspected_by, inspected_at, condition_score, findings, action_required, action_notes)
SELECT id, 'J. Harmon',   '2023-06-05 10:00:00', 2,
  'Multiple relay contacts show corrosion. System response time degraded by ~40%. Vendor quote obtained.',
  TRUE, 'Budgeted in FY2024 capital plan. Vendor: Norment. Est. $74,000.'
FROM equipment WHERE name = 'Master Control Panel';

INSERT INTO inspections
  (equipment_id, inspected_by, inspected_at, condition_score, findings, action_required, action_notes)
SELECT id, 'D. Rivera',   '2022-03-10 08:45:00', 1,
  'Speaker output distorted. Unit fails at temps below 35°F. Fails 3 of 5 call tests.',
  TRUE, 'Temporary workaround: radio channel 4 as backup. Replace before winter.'
FROM equipment WHERE name = 'Vehicle Intercom Station';

INSERT INTO inspections
  (equipment_id, inspected_by, inspected_at, condition_score, findings, action_required, action_notes)
SELECT id, 'M. Castillo', '2022-09-30 13:00:00', 1,
  'Latch mechanism stripped. Door must be physically held closed. Security breach risk.',
  TRUE, 'Out of service. Detainees relocated to Holding Cell #2.'
FROM equipment WHERE name = 'Holding Cell Door #1';
