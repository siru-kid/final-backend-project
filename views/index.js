document
  .getElementById("serchInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      const serchQuery = event.target.value;
      alert("You searched for: " + serchQuery);
    }
  });
