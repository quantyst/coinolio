const queue = require('../redis').queue;
const {Trade, Trades} = require('../models/trade.model');

/**
 * Load trade and append to req.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @param {*} id - The id of the trade to load.
 */
function load(req, res, next, id) {
  Trade.get(id)
    .then((trade) => {
      req.trade = trade; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch((e) => next(e));
}

/**
 * Get trade
 * @param {*} req
 * @param {*} res
 * @returns {Trade}
 */
function get(req, res) {
  return res.json(req.trade);
}

/**
 * Create new trade
 * @param {*} req
 * @param {*} res
 * @param {Function} next - Called when complete.
 */
function create(req, res, next) {
  Trade.create(
    {
      tran_id: req.body.tran_id,
      datetime: req.body.datetime,
      status: req.body.status,
      symbolBuy: req.body.symbolBuy,
      symbolSell: req.body.symbolSell,
      type: req.body.type,
      side: req.body.side,
      price: req.body.price,
      amount: req.body.amount,
      fee: req.body.fee,
      exchange: req.body.exchange
    },
    {
      method: 'insert'
    })
    .then((trade) => {
      const parsed = trade.toJSON();
      queue.create('event',
        {
          type: 'trade',
          values: {
            exchange: parsed.exchange,
            tran_id: parsed.tran_id,
            datetime: parsed.datetime,
            status: parsed.status,
            side: parsed.side,
            symbolBuy: parsed.symbolBuy,
            symbolSell: parsed.symbolSell,
            type: parsed.type,
            side: parsed.side,
            price: parsed.price,
            amount: parsed.amount,
            fee: parsed.fee
          }
        })
        .priority('normal')
        .save();
      return res.json(parsed);
    })
    .catch((e) => {
      next(e);
    });
}

/**
 * Update existing trade.
 * @param {*} req
 * @param {*} res
 * @param {Function} next - Called when complete.
 */
function update(req, res, next) {
  Trade
    .update({
      datetime: req.body.datetime,
      status: req.body.status,
      symbolBuy: req.body.symbolBuy,
      symbolSell: req.body.symbolSell,
      type: req.body.type,
      side: req.body.side,
      price: req.body.price,
      amount: req.body.amount,
      fee: req.body.fee,
      exchange: req.body.exchange
    }, {id: req.trade.tran_id})
    .then((savedTrade) => {
      return res.json(savedTrade);
    })
    .catch((e) => next(e));
}

/**
 * Get trade list.
 * @param {*} req
 * @param {*} res
 * @param {Function} next - Called when complete.
 */
function list(req, res, next) {
  const {limit = 60, skip = 0} = req.query;
  Trades.list({limit, skip})
    .then((trades) => res.json(trades))
    .catch((e) => next(e));
}

/**
 * Get trade list by cryptocurrency.
 * @param {*} req
 * @param {*} res
 * @param {Function} next - Called when complete.
 */
function listBySymbol(req, res, next) {
  Trades.listBySymbol(req.params.symbol)
    .then((trades) => res.json(trades))
    .catch((e) => next(e));
}

/**
 * Delete trade.
 * @param {*} req
 * @param {*} res
 * @param {Function} next - Called when complete.
 */
function remove(req, res, next) {
  Trade.destroy({id: req.trade.tran_id})
    .then((deletedTrade) => res.json(deletedTrade))
    .catch((e) => next(e));
}

module.exports = {load, get, create, update, list, listBySymbol, remove};
