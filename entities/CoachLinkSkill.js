const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'CoachLinkSkill',
  tableName: 'COACH_LINK_SKILL',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
      nullable: false,
    },
    coach_id: {
      type: 'uuid',
      nullable: false,
    },
    skill_id: {
      type: 'uuid',
      nullable: false,
    },
    created_at: {
      type: 'timestamptz',
      createDate: true,
      nullable: false,
    },
  },
  relations: {
    Coach: {
      target: 'Coach',
      type: 'many-to-one',
      joinColumn: {
        name: 'coach_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'coach_link_skill_coach_id_fk',
      },
    },
    Skill: {
      target: 'Skill',
      type: 'many-to-one',
      joinColumn: {
        name: 'skill_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'coach_link_skill_skill_id_fk',
      },
    },
  },
});
