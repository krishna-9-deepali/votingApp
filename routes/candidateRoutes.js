const express = require("express");
const router = express.Router();
const User = require("./../models/user");
const candidate = require("../models/candidate");
const { jwtAuthMiddleware, generateToken } = require("./../jwt");
// const user = require("./../models/user");
//chack the role of user
const checkAdminRole = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user.role === "admin";
  } catch (error) {
    return false;
  }
};
//post route to add the candidate
router.post("/", jwtAuthMiddleware, async (req, res) => {
  console.log(
    "before ",
    !(await checkAdminRole(req.user.id)),
    "checkAdminRole(req.user.id) it retun promise and ! of promise is false",
    !checkAdminRole(req.user.id)
  );
  if (!(await checkAdminRole(req.user.id)))
    return res.status(403).json({ message: "user does not have admin role" });
  try {
    const data = req.body; //Assuming the request body contains the candidate data
    //Create a new candidate document using mngoose model
    const newCandidate = new candidate(data);
    //save the new user in database
    const savedCandidate = await newCandidate.save();
    res.status(201).send({ savedCandidate: savedCandidate });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: "Internal Server Error " });
  }
});

//Update
router.put("/:candidateId", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id))
      return res.status(403).json({ message: "user does not have admin role" });
    const candidateId = req.params.candidateId; //Extract the  candidateId from the URL parameter
    console.log("Candidate id", candidateId);
    const updatedCandidateData = req.body; //updated data for candidate
    const response = await candidate.findByIdAndUpdate(
      candidateId,
      updatedCandidateData,
      { new: true, runValidators: true }
    );
    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    console.log("Candidate Data updated");
    res.status(200).send(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: "Internal Server Error " });
  }
});
//Delete
router.delete("/:candidateId", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id))
      return res.status(403).json({ message: "user does not have admin role" });
    const candidateId = req.params.candidateId; //Extract the  candidateId from the URL parameter
    console.log("Candidate id", candidateId);

    const response = await candidate.findByIdAndDelete(candidateId);
    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    console.log("Candidate Deleted");
    res.status(200).send(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: "Internal Server Error " });
  }
});
//lets start voting
router.post("/vote/:candidateId", jwtAuthMiddleware, async (req, res) => {
  const candidateId = req.params.candidateId;
  const userId = req.user.id;
  try {
    //Find the Candidate document with the specified candidateId
    const Candidate = await candidate.findById(candidateId);
    if (!Candidate)
      return res.status(404).json({ message: "candidate not found" });
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    if (user.isVoted) {
      return res.status(400).json({ message: "you have already voted" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin is not allowed" });
    }
    //update the cnadidate document to record the vote
    Candidate.votes.push({ user: userId });
    Candidate.votecount++;
    await Candidate.save();
    //update the user document
    user.isVoted = true;
    await user.save();
    res.status(200).json({ message: "Vote Recorded Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: "Internal Server Error " });
  }
});
//vote count
router.get("/vote/count", async (req, res) => {
  try {
    // Find  all candidates and sort them by voteCount in descending order 3ways
    //1.fisrt way
    // const voteRecord = await candidate
    //   .find()
    //   .sort({ voteCount: "desc" })
    //   .select({ party: 1, votecount: 1, _id: 0 });

    //2.second way
    const voteRecord = await candidate
      .find({}, "name party  votecount -_id")
      .sort({ voteCount: "desc" });
    //3.third way
    // const candidates = await candidate.find().sort({ voteCount: "desc" });
    //Map the candidates to only return their name  and voteCount
    // const voteRecord = candidates.map((data) => {
    //   return {
    //     party: data.party,
    //     count: data.votecount,
    //   };
    // });
    return res.status(200).json(voteRecord);
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: "Internal Server Error " });
  }
});
//list of candidates
router.get("/", async (req, res) => {
  try {
    // const listOfCandidates = await candidate
    //   .find()
    //   .select({ name: 1, party: 1, _id: 0 });
    // const nameOfCandidates = listOfCandidates.map((data) => {
    //   return {
    //     name: data.name,
    //     party: data.party,
    //   };
    // });
    // Find all candidates and select only the name and party fields, excluding _id
    const candidates = await candidate.find({}, "name party -_id");
    // Return the list of candidates
    res.status(200).send({ ListOfCandidates: candidates });
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: "Internal Server Error " });
  }
});
module.exports = router;
