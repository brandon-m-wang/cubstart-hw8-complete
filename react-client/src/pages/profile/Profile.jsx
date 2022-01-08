import "./profile.css";
import Topbar from "../../components/topbar/Topbar";
import Sidebar from "../../components/sidebar/Sidebar";
import Feed from "../../components/feed/Feed";
import Rightbar from "../../components/rightbar/Rightbar";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router";
import { useRef } from "react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Profile() {
  const PF = process.env.REACT_APP_PUBLIC_FOLDER;
  const [user, setUser] = useState({});
  const [file, setFile] = useState(null);
  const { dispatch } = useContext(AuthContext);
  const uploadPhoto = useRef();
  const username = useParams().username;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`/users?username=${username}`);
        setUser(res.data);
      } catch (error) {
        window.location.href = "/";
      }
    };
    fetchUser();
  }, [username]);

  const submitHandler = async (e) => {
    e.preventDefault();
    const updateFields = {
      userId: user._id,
    };

    if (file) {
      const data = new FormData();
      const fileName = Date.now() + file.name;
      data.append("name", fileName);
      data.append("file", file);
      console.log(fileName);
      updateFields.profilePicture = fileName;
      dispatch({ type: "UPDATE_PROFILE", payload: fileName });
      try {
        await axios.post("/upload", data);
      } catch (error) {
        console.log(error);
      }
    }
    try {
      await axios.put(`/users/${user._id}`, updateFields);
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Topbar />
      <div className="profile">
        <Sidebar />
        <div className="profileRight">
          <div className="profileRightTop">
            <div className="profileCover">
              <img
                className="profileCoverImg"
                src={
                  user.coverImg ? PF + user.coverImg : PF + "person/noCover.png"
                }
                alt=""
              />
              <form id="form" onSubmit={submitHandler}>
                <label htmlFor="pfp" className="shareOption">
                  <img
                    className="profileUserImg"
                    src={
                      user.profilePicture
                        ? PF + user.profilePicture
                        : PF + "person/noAvatar.png"
                    }
                    alt=""
                  />
                  <input
                    style={{ display: "none" }}
                    type="file"
                    id="pfp"
                    accept=".png, .jpeg, .jpg"
                    onChange={(e) => {
                      setFile(e.target.files[0]);
                      uploadPhoto.current.style.visibility = "visible";
                    }} // build this hook
                  />
                </label>
                <button
                  ref={uploadPhoto}
                  className="uploadButton"
                  type="submit"
                >
                  Upload photo
                </button>
              </form>
            </div>
            <div className="profileInfo">
              <h4 className="profileInfoName">{user.username}</h4>
              <span className="profileInfoDesc">{user.description}</span>
            </div>
          </div>
          <div className="profileRightBottom">
            <Feed username={username} />
            <Rightbar user={user} />
          </div>
        </div>
      </div>
    </>
  );
}
