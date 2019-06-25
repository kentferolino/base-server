const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");

// Item Model
const Item = require("../../models/Item");

// @route  GET api/items
// @desc   Get all items
// @access Public
router.get("/", (req, res) => {
  Item.find()
    .sort({ date: -1 })
    .then(items => res.json(items));
});

// @route  POST api/items
// @desc   Create an item
// @access Private
router.post("/", auth, (req, res) => {
  const newItem = new Item({
    name: req.body.name
  });

  newItem.save().then(item => res.json(item));
});

// @route  PUT api/items
// @desc   Update an item
// @access Private
router.put("/:id", auth, (req, res) => {
  const itemID = req.params.id;
  const itemInputs = req.body;

  Item.findById(itemID, function (err, item) {
    if (!item) res.status(404).json({ success: false, msg: "Item not found." });
    else {
      item.name = itemInputs.name;
      item
        .save()
        .then(item => res.json(item))
        .catch(err =>
          res
            .status(400)
            .json({ success: false, msg: `Update failed. ${err}` })
        );
    }
  });
});

// @route  DELETE api/items/:id
// @desc   Delete an item
// @access Private
router.delete("/:id", auth, (req, res) => {
  Item.findById(req.params.id)
    .then(item => item.remove().then(() => res.json({ success: true })))
    .catch(err => res.status(404).json({ success: false }));
});

module.exports = router;
