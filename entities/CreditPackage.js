const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'CreditPackage',
  tableName: 'CREDIT_PACKAGE',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
      nullable: false,
    },
    name: {
      type: 'varchar',
      length: 50,
      nullable: false,
      unique: true,
    },
    credit_amount: {
      type: 'integer',
      nullable: false,
    },
    price: {
      type: 'numeric',
      precision: 10,
      scale: 2,
      nullable: false,
      transformer: {
        to: (value) => parseFloat(value),
        from: (value) => (value % 1 === 0 ? parseInt(value) : parseFloat(value)), // 若數字為整數則去除小數部分
      },
    },
    created_at: {
      type: 'timestamptz',
      createDate: true,
      nullable: false,
    },
  },
});
