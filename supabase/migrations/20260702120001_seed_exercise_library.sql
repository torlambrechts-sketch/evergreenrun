-- Seed the exercise library for the Foundation strength A/B sessions.
-- Competence-block (easier) exercises double as regressions for the load-block
-- ones, so the engine can substitute (not skip) when a flag is contraindicated.
-- ⟨advisor⟩ The exercise selection/flags are draft product content, not signed.

insert into public.exercise (slug, name, category, block, tempo, contraindication_flags, instructions) values
  ('seated-calf-raise', 'Seated Calf Raise', 'calf', 'competence', null, '{}', 'Slow and controlled through full range.'),
  ('box-squat', 'Box Squat', 'quad', 'competence', null, '{}', 'Sit back to a box at a comfortable depth.'),
  ('glute-bridge', 'Glute Bridge', 'glute', 'competence', null, '{}', 'Drive through the heels, squeeze at the top.'),
  ('romanian-deadlift', 'Romanian Deadlift', 'hamstring', 'competence', null, '{}', 'Hinge at the hips, soft knees, flat back.'),
  ('dead-bug', 'Dead Bug', 'core', 'competence', null, '{}', 'Slow, keep the low back gently pressed down.'),
  ('side-plank', 'Side Plank', 'core', 'competence', null, '{}', 'Stack the hips, breathe steadily.'),
  ('hsr-calf-raise', 'Heavy Slow Calf Raise', 'calf', 'load', '3-0-3', '{achilles}', 'Heavy, slow tempo (3s up, 3s down) for calf/Achilles capacity.'),
  ('goblet-squat', 'Goblet Squat', 'quad', 'load', null, '{knee}', 'Hold a weight at the chest, controlled depth.'),
  ('step-up', 'Step-Up', 'glute', 'load', null, '{knee}', 'Controlled up and down onto a step.'),
  ('single-leg-rdl', 'Single-Leg RDL', 'hamstring', 'load', null, '{balance}', 'Hinge on one leg, hips level.'),
  ('hip-thrust', 'Hip Thrust', 'glute', 'load', null, '{}', 'Shoulders on a bench, drive hips up.')
on conflict (slug) do nothing;

-- Wire regression links: each flagged load exercise falls back to a competence variant.
update public.exercise l set regression_of = r.id
from public.exercise r
where (l.slug, r.slug) in (
  ('hsr-calf-raise', 'seated-calf-raise'),
  ('goblet-squat',   'box-squat'),
  ('step-up',        'glute-bridge'),
  ('single-leg-rdl', 'romanian-deadlift')
);
