module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      filename: env('DATABASE_FILENAME', '.tmp/test.db')
    },
    useNullAsDefault: true,
    debug: false
  }
});
