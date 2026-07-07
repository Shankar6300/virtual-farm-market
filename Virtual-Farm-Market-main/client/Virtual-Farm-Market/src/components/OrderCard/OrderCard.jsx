import React, { useEffect, useState } from "react";
import "./OrderCard.css";
import Typography from "@mui/material/Typography";
import {
  Box,
  Stack,
  Tooltip,
  IconButton,
  Grid,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Button
} from "@mui/material";
import { green, orange, red } from "@mui/material/colors";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import { useRef } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { GET_UPDATE_STATUS_ORDER_FARMER } from "../../Redux/Reducers/Farmer/farmerReducer";
import Axios from "../../Utils/Axios";

const steps = ["Placed", "Packed", "Shipped", "Delivered"];

const getActiveStep = (status) => {
  const s = status ? status.toLowerCase() : "";
  if (s === "placed") return 0;
  if (s === "packed") return 1;
  if (s === "shipped") return 2;
  if (s === "delivered") return 3;
  return 0;
};

function OrderCard({ order, userType }) {
  const date = new Date(order.createdAt);
  const [orederTime, setOrderTime] = useState();
  const componentRef = useRef(null);
  const dispatch = useDispatch();

  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const auth = useSelector((state) => state.auth);

  const receiverId =
    userType === "Farmer"
      ? order.user && order.user._id
      : order.products && order.products.seller && order.products.seller._id;

  const fetchMessages = async () => {
    try {
      const res = await Axios.post("/api/getMessages", { order: order._id });
      if (res.data && res.data.status === "success") {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!chatText.trim()) return;
    try {
      const res = await Axios.post("/api/sendMessage", {
        order: order._id,
        receiver: receiverId,
        text: chatText,
      });
      if (res.data && res.data.status === "success") {
        setChatText("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userType !== "Farmer") {
      if (componentRef.current) {
        window.scrollTo({
          top: componentRef.current.offsetTop,
          behavior: "smooth",
        });
      }
    }

    const formattedTime = date.toLocaleDateString(undefined, {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    setOrderTime(formattedTime);
  }, []);

  // Poll for messages when chat panel is open
  useEffect(() => {
    let interval;
    if (showChat) {
      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showChat]);

  const handleCopy = () => {
    const el = document.createElement("textarea");
    el.value = `ORDER ID - ${order.orderNumber}`;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  };

  return (
    <div>
      <div ref={componentRef} className="courses-container" style={{ marginBottom: showChat ? 0 : "30px" }}>
        <div className="course">
          <div className="course-preview">
            <Box
              sx={{
                height: 140,
                width: 140,
                position: "relative",
                overflow: "hidden",
                borderRadius: 2,
              }}
            >
              <img
                alt={order.products.name}
                src={order.products.images[0]}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
            </Box>
          </div>
          <div className="course-info" style={{ flexGrow: 1 }}>
            <Stack
              direction="row"
              sx={{ display: "flex", justifyContent: "space-between" }}
            >
              <Stack sx={{ flexGrow: 1, mr: 2 }}>
                {" "}
                <Box display="flex" alignItems="center">
                  <h6>
                    <Typography
                      onClick={handleCopy}
                      style={{ cursor: "pointer", marginRight: "8px" }}
                    >
                      ORDER ID - {order.orderNumber}
                    </Typography>
                  </h6>
                  <IconButton
                    aria-label="copy"
                    onClick={handleCopy}
                    style={{ cursor: "pointer" }}
                  >
                    <FileCopyIcon />
                  </IconButton>
                </Box>
                <Typography variant="h4">{order.products.name}</Typography>
                <Typography sx={{ fontSize: 20 }}>
                  Quantity: {order.products.quantity}
                </Typography>
                <Typography sx={{ fontSize: 20 }}>
                  Price: ₹{order.products.price}
                </Typography>
                <br />
                <Typography variant="body1">
                  Order Time: {orederTime}
                </Typography>

                {userType !== "Farmer" && (
                  <Box sx={{ width: "100%", mt: 3, mb: 1 }}>
                    <Stepper activeStep={getActiveStep(order.orderStatus)} alternativeLabel>
                      {steps.map((label) => (
                        <Step key={label}>
                          <StepLabel>{label}</StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  </Box>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowChat(!showChat)}
                  sx={{ mt: 2, alignSelf: "flex-start", borderColor: green[700], color: green[700], "&:hover": { borderColor: green[900], bgcolor: green[50] } }}
                >
                  {showChat ? "Close Chat" : `Chat with ${userType === "Farmer" ? "Customer" : "Farmer"}`}
                </Button>
              </Stack>
              <Stack sx={{ minWidth: 150, alignItems: "flex-end" }}>
                <Tooltip title="Status">
                  <Typography
                    variant="body1"
                    sx={
                      order.orderStatus &&
                      order.orderStatus.toUpperCase() === "DELIVERED"
                        ? {
                            color: green["A700"],
                            fontWeight: "bold",
                          }
                        : {
                            color: orange[800],
                            fontWeight: "bold",
                          }
                    }
                  >
                    {order.orderStatus.toUpperCase()}
                  </Typography>
                </Tooltip>
                {userType === "Farmer" && (
                  <Formik
                    initialValues={{
                      orderStatus: order.orderStatus || "Placed",
                    }}
                    onSubmit={(values) => {
                      const finalOrderStatusObj = {
                        _id: order._id,
                        orderStatus: values.orderStatus,
                      };

                      dispatch({
                        type: GET_UPDATE_STATUS_ORDER_FARMER,
                        payload: finalOrderStatusObj,
                      });
                    }}
                  >
                    {({ values, handleSubmit, setFieldValue }) => (
                      <Form>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <strong style={{ fontSize: 16 }}>Update Status:</strong>{" "}
                            <Field
                              as={Select}
                              id="orderStatus"
                              name="orderStatus"
                              autoComplete="orderStatus"
                              sx={{ mt: 1, minWidth: 120 }}
                              onChange={(e) => {
                                setFieldValue("orderStatus", e.target.value);
                                handleSubmit();
                              }}
                            >
                              <MenuItem value="Placed">Placed</MenuItem>
                              <MenuItem value="Packed">Packed</MenuItem>
                              <MenuItem value="Shipped">Shipped</MenuItem>
                              <MenuItem value="Delivered">Delivered</MenuItem>
                            </Field>
                            <ErrorMessage
                              name="orderStatus"
                              id="orderStatus"
                              component="div"
                              className="error text-danger"
                            />
                          </Grid>
                        </Grid>
                      </Form>
                    )}
                  </Formik>
                )}
              </Stack>
            </Stack>
          </div>
        </div>
      </div>

      {showChat && (
        <Box
          sx={{
            mx: "auto",
            maxWidth: "740px",
            p: 3,
            border: "1px solid #ddd",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            bgcolor: "#fdfdfd",
            boxShadow: 2,
            mb: 4,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, color: green[800] }}>
            Order Conversation ({userType === "Farmer" ? "Farmer Portal" : "Customer Portal"})
          </Typography>
          <Box
            sx={{
              height: 220,
              overflowY: "auto",
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              p: 2,
              mb: 2,
              bgcolor: "#fcfcfc",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {messages.length ? (
              messages.map((msg, i) => {
                const isMe = msg.sender === auth._idOfLoggedIn;
                return (
                  <Box
                    key={i}
                    sx={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      bgcolor: isMe ? "#c8e6c9" : "#e0f7fa",
                      color: "#333",
                      p: 1.5,
                      borderRadius: 3,
                      maxWidth: "70%",
                      boxShadow: 1,
                      wordBreak: "break-word",
                    }}
                  >
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ fontWeight: "bold", mb: 0.5 }}>
                      {msg.senderName}
                    </Typography>
                    <Typography variant="body2">{msg.text}</Typography>
                  </Box>
                );
              })
            ) : (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ my: "auto" }}>
                No messages yet. Send a message to start communicating!
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              fullWidth
              placeholder="Type your message..."
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
            />
            <Button variant="contained" color="success" onClick={handleSendMessage} sx={{ bgcolor: green[700], "&:hover": { bgcolor: green[800] } }}>
              Send
            </Button>
          </Stack>
        </Box>
      )}
    </div>
  );
}

export default OrderCard;
