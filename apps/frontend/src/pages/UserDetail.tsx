import { useParams } from "react-router";

function loader() {
  return null;
}

function action() {
  return null;
}

function UserDetail() {
  const params = useParams();

  return (
    <div>
      <div>User: {params.userId}</div>
    </div>
  );
}

UserDetail.loader = loader;
UserDetail.action = action;

export default UserDetail;
