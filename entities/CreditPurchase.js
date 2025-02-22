const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'CreditPurchase',
  tableName: 'CREDIT_PURCHASE',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
      nullable: false,
    },
    user_id: {
      type: 'uuid',
      nullable: false,
    },
    credit_package_id: {
      type: 'uuid',
      nullable: false,
    },
    purchased_credits: {
      type: 'integer',
      nullable: false,
    },
    price_paid: {
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
    purchase_at: {
      type: 'timestamptz',
      nullable: false,
    },
  },
  relations: {
    User: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: {
        name: 'user_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'credit_purchase_user_id_fk',
      },
    },
    CreditPackage: {
      target: 'CreditPackage',
      type: 'many-to-one',
      joinColumn: {
        name: 'credit_package_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'credit_purchase_credit_package_id_fk',
      },
    },
  },
});
