const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const jwt = require('jsonwebtoken');

// User model
const Exercise = require('../../models/exercise');
const jwtConfig = require('./Config/jwtConfig');
const exercise = require('../../models/exercise');

// @route POST api/exercise/create
// @desc Create exercise
// @access  Public
router.post('/create', async (req, res) => {
	const { token, name, sets, reps, weight, time, distance, notes } = req.body;

	var isCardio = false;

	httpErr = 500;
	if (!token) {
		res.status(403).json();
	} else {
		jwt.verify(token, jwtConfig.secretKey, async (err, authData) => {
			if (err) {
				if (err.name == "TokenExpiredError") {
					res.status(401).json()
				} else {
					res.status(403).json()
				}
			} else {
				try {
					if (!name || (isCardio == undefined)) {
						httpErr = 400;
						throw Error('Missing required fields');
					}
					if ((sets || reps || weight) && (time || distance)) {
						httpErr = 400;
						throw Error('Conflicting strength and cardio information');
					}

					var newExercise;
					if (isCardio) {
						newExercise = new Exercise({
							userId: authData._id,
							name,
							time,
							distance,
							isCardio,
							notes
						})
					} else {
						newExercise = new Exercise({
							userId: authData._id,
							name,
							sets,
							reps,
							weight,
							isCardio,
							notes
						})
					}

					const savedExercise = await newExercise.save();
					if (!savedExercise) {
						httpErr = 500;
						throw Error('Something went wrong saving the user');
					}

					res.status(200).json({exercise : savedExercise})

				} catch (e) {
					res.status(httpErr).json({ err: e.message });
				}
			}
		});
	}
});

// @route POST api/exercise/read
// @desc Read single exercise by ID
// @access  Public
router.post('/read', async (req, res) => {
	const { token, id } = req.body;

	httpErr = 500;
	if (!token) {
		res.status(403).json();
	} else {
		jwt.verify(token, jwtConfig.secretKey, async (err, authData) => {
			if (err) {
				if (err.name == "TokenExpiredError") {
					res.status(401).json()
				} else {
					res.status(403).json()
				}
			} else {

				try {
					if (!id) {
						httpErr = 400
						throw Error('No id');
					}

					var exercise = await Exercise.findById(id);

					// Auth
					if (!exercise) {
						httpErr = 404
						throw Error('Nonexistent Exercise')
					}

					if (exercise.userId != authData._id) {
						httpErr = 403;
						throw Error('Invalid credentials')
					}

					delete exercise['userId'];

					res.status(200).json({ exercise });

				} catch (e) {
					res.status(httpErr).json({ err: e.message });
				}
			}
		});
	}
});

// @route POST api/exercise/readAll
// @desc Get all exercises associated with user
// @access  Public
router.post('/readAll', async (req, res) => {
	const { token } = req.body;

	httpErr = 500;
	if (!token) {
		res.status(403).json();
	} else {
		jwt.verify(token, jwtConfig.secretKey, async (err, authData) => {
			if (err) {
				if (err.name == "TokenExpiredError") {
					res.status(401).json()
				} else {
					res.status(403).json()
				}
			} else {
				try {
					const exercises = await Exercise.find({ userId: authData._id });

					res.status(200).json({ exercises });
				} catch (e) {
					res.status(httpErr).json({ err: e.message });
				}
			}
		});
	}
});

// @route POST api/exercise/update
// @desc Update single exercise by ID
// @access  Public
router.post('/update', async (req, res) => {
	const { token, id } = req.body;
	const { name, sets, reps, weight, time, distance, isCardio, notes } = req.body;

	httpErr = 500;
	if (!token) {
		res.status(403).json();
	} else {
		jwt.verify(token, jwtConfig.secretKey, async (err, authData) => {
			if (err) {
				if (err.name == "TokenExpiredError") {
					res.status(401).json();
				} else {
					res.status(403).json();
				}
			} else {

				try {
					if (!id) {
						httpErr = 400
						throw Error('No id');
					}

					const exercise = await Exercise.findById(id);

					if (!exercise) {
						httpErr = 404
						throw Error('Nonexistent Exercise');
					}

					if (exercise.userId != authData._id) {
						httpErr = 403;
						throw Error('Invalid credentials');
					}

					Exercise.findByIdAndUpdate(id,
						{
							name, sets, reps, weight, time, distance, isCardio, notes
						},
						function (err) {
							res.status(200).json();
						})
						.setOptions({ omitUndefined: true });;
				} catch (e) {
					res.status(httpErr).json({ err: e.message });
				}
			}
		});
	}
});

// @route POST api/exercise/delete
// @desc Delete single exercise by ID
// @access  Public
router.post('/delete', async (req, res) => {
	const { token, id } = req.body;

	httpErr = 500;
	if (!token) {
		res.status(403).json();
	} else {
		jwt.verify(token, jwtConfig.secretKey, async (err, authData) => {
			if (err) {
				if (err.name == "TokenExpiredError") {
					res.status(401).json();
				} else {
					res.status(403).json();
				}
			} else {

				try {
					if (!id) {
						httpErr = 400
						throw Error('No id');
					}

					const exercise = await Exercise.findById(id);

					if (!exercise) {
						httpErr = 404
						throw Error('Nonexistent Exercise');
					}

					if (exercise.userId != authData._id) {
						httpErr = 403;
						throw Error('Invalid credentials');
					}

					Exercise.findByIdAndDelete(id,
						function (err) {
							res.status(200).json();
						});

					// TODO Delete all references of the id from all workouts

				} catch (e) {
					res.status(httpErr).json({ err: e.message });
				}
			}
		});
	}
});

module.exports = router;