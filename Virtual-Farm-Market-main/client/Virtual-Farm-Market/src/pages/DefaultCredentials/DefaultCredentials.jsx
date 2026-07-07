import React from "react";
import PaymentAlert from "../../components/Alert/PaymentAlert";
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  CLEARE_MESSAGE_PAYMENT,
  GET_ALL_CARD_PAYMENT,
  GET_MAKE_PAYMENT,
} from "../../Redux/Reducers/paymentReducer";
import DefaultButton from "../../components/Buttons/DefaultButton";
import { green, orange, red } from "@mui/material/colors";
import {
  CLEAR_MESSAGE_ADDRESS,
  CLEAR_OBJECT_ADDRESS,
  GET_ALL_ADDRESS,
  GET_DELETE_ADDRESS,
  GET_MAKE_DEFAULT_ADDRESS,
  GET_OBJECT_ADDRESS,
} from "../../Redux/Reducers/addressReducer";
import AddressAlert from "../../components/Alert/AddressAlert";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import { AddCircle } from "@mui/icons-material";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";

import Visa from "../../Assets/card/visa.png";
import Discover from "../../Assets/card/discover.png";
import JCB from "../../Assets/card/jcb.png";
import MasterCard from "../../Assets/card/maestro.png";
import UnionPay from "../../Assets/card/unionpay.png";
import DinersClub from "../../Assets/card/dinersclub.png";
import AmericanExpress from "../../Assets/card/americanexpress.png";
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import SendIcon from "@mui/icons-material/Send";
import { useContext } from "react";
import { CheckoutContext } from "../../Utils/ContextAPIs/CheckoutContext";
import {
  GET_ALL_NOTI,
  GET_COUNT_OF_NOTI,
} from "../../Redux/Reducers/userNotificationReducer";
import {
  CLEAR_CART_LIST_CART,
  GET_ALLPRODUCTS_CART,
  GET_CART_ITEM_COUNT_CART,
} from "../../Redux/Reducers/cartReducer";

const cardImages = {
  Visa,
  Discover,
  JCB,
  MasterCard,
  UnionPay,
  "Diners Club": DinersClub,
  "American Express": AmericanExpress,
};

function DefaultCredentials() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const payment = useSelector((state) => state.payment);
  const address = useSelector((state) => state.address);
  const stripePayment = useSelector((state) => state.stripePayment);

  const [paymentMethod, setPaymentMethod] = React.useState("Card");
  const [upiId, setUpiId] = React.useState("");
  const { checkoutData, setCheckoutData } = useContext(CheckoutContext);

  useEffect(() => {
    //To clear address from edit addressObj of address.
    dispatch({ type: CLEAR_OBJECT_ADDRESS });

    dispatch({ type: GET_ALL_CARD_PAYMENT });
    dispatch({ type: GET_ALL_ADDRESS });
  }, []);

  useEffect(() => {
    dispatch({ type: GET_ALL_CARD_PAYMENT });
    dispatch({ type: GET_ALL_ADDRESS });
  }, [navigate, dispatch]);

  useEffect(() => {
    if (address.message) {
      toast.success(address.message);
    }
    dispatch({ type: CLEAR_MESSAGE_ADDRESS });
    dispatch({ type: GET_ALL_ADDRESS });
  }, [address.message]);

  useEffect(() => {
    if (payment.message) {
      toast.success(payment.message);
      dispatch({ type: GET_ALL_NOTI });
      dispatch({ type: GET_COUNT_OF_NOTI });
      dispatch({ type: CLEAR_CART_LIST_CART });
      setCheckoutData(null);

      dispatch({ type: GET_ALLPRODUCTS_CART });
      dispatch({ type: GET_CART_ITEM_COUNT_CART });

      dispatch({ type: CLEARE_MESSAGE_PAYMENT });

      navigate("/user/paymentsuccess");
    }
  }, [payment.message]);

  const handleGoToPaymentPage = () => {
    navigate("/user/paymentgateway");
  };

  const handleGoToAddressPage = () => {
    navigate("/user/addaddress");
  };

  const handleRemoveAddress = (id) => {
    dispatch({ type: GET_DELETE_ADDRESS, payload: { _id: id } });
  };

  const handleAddressEdit = (id) => {
    dispatch({ type: GET_OBJECT_ADDRESS, payload: { _id: id } });
    navigate("/user/addaddress");
  };

  const handleMakeDefaultAddress = (id) => {
    dispatch({ type: GET_MAKE_DEFAULT_ADDRESS, payload: { _id: id } });
  };

  const handleProceedToCheckout = () => {
    if (!checkoutData) return;
    dispatch({
      type: GET_MAKE_PAYMENT,
      payload: {
        products: JSON.stringify(checkoutData.products),
        amount: checkoutData.amount,
        userAddress:
          address.addressList[0].defaultAddress &&
          address.addressList[0]._id,
        paymentMethod: paymentMethod,
        upiId: paymentMethod === "UPI" ? upiId : undefined,
      },
    });
  };

  const isProceedDisabled = () => {
    if (!(checkoutData && checkoutData.amount)) return true;
    if (!address.addressList.length || !address.addressList[0]?.defaultAddress) return true;
    
    if (paymentMethod === "Card") {
      return !stripePayment.cardList.length || !stripePayment.cardList[0]?.isDefaultCard;
    }
    if (paymentMethod === "UPI") {
      return !upiId || !upiId.match(/^[\w.-]+@[\w.-]+$/);
    }
    return false; // COD is always ready if address is there
  };

  return (
    <>
      <Container maxWidth="md">
        {address.loading || stripePayment.loading || payment.loading ? (
          <>
            <br />
            <br />
            <br />
            <LinearProgress color="success" />
          </>
        ) : (
          <Grid container direction="column">
            <Grid item>
              <Container maxWidth="md" sx={{ mt: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "end" }}>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: orange["A700"],
                      "&:hover": { bgcolor: orange["A400"] },
                    }}
                    endIcon={<SendIcon />}
                    onClick={() => handleProceedToCheckout()}
                    disabled={isProceedDisabled()}
                  >
                    Proceed to checkout (Total: ₹
                    {checkoutData ? checkoutData.amount : 0})
                  </Button>
                </Box>
                <Box>
                  <Typography variant="h4">Payment Method</Typography>
                  <Box>
                    {payment.error && (
                      <Alert severity="error">{payment.error}</Alert>
                    )}
                  </Box>

                  {/* Payment Selector Cards */}
                  <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                      <Card 
                        onClick={() => setPaymentMethod("Card")}
                        sx={{ 
                          p: 2, 
                          cursor: "pointer", 
                          border: paymentMethod === "Card" ? "2px solid #2e7d32" : "1px solid #ddd",
                          bgcolor: paymentMethod === "Card" ? "#f1f8e9" : "#fff",
                          boxShadow: paymentMethod === "Card" ? 3 : 1,
                          transition: "0.2s"
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>Credit/Debit Card</Typography>
                        <Typography variant="body2" color="textSecondary">Pay securely using Stripe</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card 
                        onClick={() => setPaymentMethod("UPI")}
                        sx={{ 
                          p: 2, 
                          cursor: "pointer", 
                          border: paymentMethod === "UPI" ? "2px solid #2e7d32" : "1px solid #ddd",
                          bgcolor: paymentMethod === "UPI" ? "#f1f8e9" : "#fff",
                          boxShadow: paymentMethod === "UPI" ? 3 : 1,
                          transition: "0.2s"
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>UPI</Typography>
                        <Typography variant="body2" color="textSecondary">GPay, PhonePe, Paytm</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card 
                        onClick={() => setPaymentMethod("COD")}
                        sx={{ 
                          p: 2, 
                          cursor: "pointer", 
                          border: paymentMethod === "COD" ? "2px solid #2e7d32" : "1px solid #ddd",
                          bgcolor: paymentMethod === "COD" ? "#f1f8e9" : "#fff",
                          boxShadow: paymentMethod === "COD" ? 3 : 1,
                          transition: "0.2s"
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>Cash on Delivery</Typography>
                        <Typography variant="body2" color="textSecondary">Pay with cash upon arrival</Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Payment Details Area */}
                  <Box sx={{ minWidth: 450 }}>
                    {paymentMethod === "Card" && (
                      <>
                        <Box sx={{ display: "flex", justifyContent: "end", mb: 1 }}>
                          <Button
                            size="large"
                            onClick={() => handleGoToPaymentPage()}
                            startIcon={<AddCircle />}
                          >
                            ADD/CHANGE CARD
                          </Button>
                        </Box>
                        {stripePayment.cardList.length !== 0 &&
                          !stripePayment.cardList[0]?.isDefaultCard && (
                            <Alert severity="error" sx={{ m: 2 }}>
                              Select card as a default:-{" "}
                              <Button onClick={() => handleGoToPaymentPage()}>
                                Select Default Card
                              </Button>
                            </Alert>
                          )}
                        {stripePayment.cardList.length ? (
                          stripePayment.cardList[0].isDefaultCard ? (
                            <Paper
                              elevation={4}
                              sx={{
                                p: 3,
                                mb: 2,
                              }}
                            >
                              <Grid
                                container
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Grid item>
                                  <Grid
                                    container
                                    justifyContent={"space-between"}
                                    spacing={1}
                                    direction="column"
                                  >
                                    <Grid item>
                                      <Typography variant="h6">
                                        <strong>Card Number:</strong> **** ****
                                        **** {stripePayment.cardList[0].last4}
                                      </Typography>
                                    </Grid>
                                    <Grid item>
                                      <Stack direction="row">
                                        <Stack>
                                          <Typography variant="h6">
                                            <strong>Expires:&nbsp;</strong>
                                            {stripePayment.cardList[0].exp_month +
                                              "/" +
                                              stripePayment.cardList[0].exp_year}
                                          </Typography>
                                        </Stack>
                                        <Stack sx={{ ml: 4 }}>
                                          <Typography variant="h6">
                                            <strong>CVV:</strong> ***
                                          </Typography>
                                        </Stack>
                                      </Stack>
                                    </Grid>
                                    <Grid item>
                                      <Stack direction="row" spacing={1}>
                                        <Stack>
                                          <Typography variant="h5">
                                            Card brand:
                                          </Typography>
                                        </Stack>
                                        <Stack>
                                          <Typography variant="h5">
                                            {stripePayment.cardList[0].brand}
                                          </Typography>
                                        </Stack>
                                        <Stack>
                                          <img
                                            className="img-fluid"
                                            src={
                                              cardImages[
                                                stripePayment.cardList[0].brand
                                              ]
                                            }
                                            alt={stripePayment.cardList[0].brand}
                                            style={{
                                              height: "30px",
                                              width: "auto",
                                              marginTop: "2px",
                                            }}
                                          />
                                        </Stack>
                                      </Stack>
                                    </Grid>
                                  </Grid>
                                </Grid>
                                <Grid item sx={{ display: "flex", alignItems: "center" }}>
                                  <DefaultButton />
                                </Grid>
                              </Grid>
                            </Paper>
                          ) : (
                            <PaymentAlert {...{ handleGoToPaymentPage }} />
                          )
                        ) : (
                          <PaymentAlert {...{ handleGoToPaymentPage }} />
                        )}
                      </>
                    )}

                    {paymentMethod === "UPI" && (
                      <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                          Enter UPI Details
                        </Typography>
                        <TextField
                          fullWidth
                          label="UPI ID (e.g. username@bank)"
                          placeholder="username@okaxis"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          error={upiId.length > 0 && !upiId.match(/^[\w.-]+@[\w.-]+$/)}
                          helperText={upiId.length > 0 && !upiId.match(/^[\w.-]+@[\w.-]+$/) ? "Invalid UPI ID format" : "Payment request will be sent to this ID"}
                        />
                      </Paper>
                    )}

                    {paymentMethod === "COD" && (
                      <Paper elevation={3} sx={{ p: 3, mb: 2, bgcolor: "#fffde7", borderLeft: "5px solid #fbc02d" }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold", color: "#f57f17" }}>
                          Cash on Delivery Selected
                        </Typography>
                        <Typography variant="body1">
                          Please prepare the cash amount of <strong>₹{checkoutData ? checkoutData.amount : 0}</strong> to pay our delivery agent upon arrival.
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                </Box>
              </Container>
            </Grid>

            <Grid item>
              <Container maxWidth="md">
                <Box>
                  <Typography variant="h4" sx={{ mt: 6 }}>
                    Address List
                  </Typography>
                  {address.addressList.length ? (
                    <>
                      <Box sx={{ display: "flex", justifyContent: "end" }}>
                        <Button
                          size="large"
                          onClick={() => handleGoToAddressPage()}
                          startIcon={<AddCircle />}
                        >
                          ADD ADDRESS
                        </Button>
                      </Box>

                      {address.addressList.map((item, index) => (
                        <Card sx={{ p: 2, mb: 2 }} elevation={3} key={index}>
                          <Grid container>
                            <Grid item xs={10}>
                              <Box>
                                <Typography variant="h5">
                                  Name: {item.fullName}
                                </Typography>
                                <Typography variant="h5">
                                  Phone number: {item.phoneNumber}
                                </Typography>
                                <Typography sx={{ mt: 2 }}>
                                  <strong>Address :</strong> {item.address}{" "}
                                  {item.address2}
                                </Typography>
                                <Typography>
                                  <strong>City : </strong>
                                  {item.city}
                                </Typography>
                                <Box sx={{ display: "flex" }}>
                                  <Typography>
                                    <strong>Province : </strong>
                                    {item.province}
                                  </Typography>
                                  <Typography sx={{ mx: 4 }}>
                                    <strong> Postal Code : </strong>
                                    {item.postalCode}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid item xs={2}>
                              {item.defaultAddress ? (
                                <DefaultButton />
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "end",
                                  }}
                                >
                                  <Tooltip
                                    title="Make Dafault"
                                    open={
                                      !(
                                        address.addressList[0].defaultAddress &&
                                        address.addressList[0].defaultAddress
                                      )
                                    }
                                    arrow
                                  >
                                    <Button
                                      disableElevation
                                      variant="outlined"
                                      onClick={() =>
                                        handleMakeDefaultAddress(item._id)
                                      }
                                      sx={{
                                        border: "none",
                                        "&:hover": {
                                          bgcolor: green[500],
                                          color: "white",
                                          border: "none",
                                        },
                                      }}
                                    >
                                      <BookmarkAddIcon />
                                    </Button>{" "}
                                  </Tooltip>
                                </Box>
                              )}
                            </Grid>
                          </Grid>

                          <Box sx={{ display: "flex", justifyContent: "end" }}>
                            <Button
                              onClick={() => handleRemoveAddress(item._id)}
                              variant="contained"
                              sx={{
                                color: "white",
                                bgcolor: red["A400"],
                                "&:hover": {
                                  bgcolor: red[800],
                                  color: "white",
                                  border: "none",
                                },
                              }}
                              endIcon={<DeleteIcon />}
                            >
                              DELETE ADDRESS
                            </Button>
                            <Button
                              variant="contained"
                              sx={{ ml: 1 }}
                              onClick={() => {
                                handleAddressEdit(item._id);
                              }}
                            >
                              Edit
                            </Button>
                          </Box>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <AddressAlert {...{ handleGoToAddressPage }} />
                  )}
                </Box>
              </Container>
            </Grid>
            <Grid item>
              <Container maxWidth="md" sx={{ mt: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "end" }}>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: orange["A700"],
                      "&:hover": { bgcolor: orange["A400"] },
                    }}
                    endIcon={<SendIcon />}
                    onClick={() => handleProceedToCheckout()}
                    disabled={isProceedDisabled()}
                  >
                    Proceed to checkout (Total: ₹
                    {checkoutData ? checkoutData.amount : 0})
                  </Button>
                </Box>
              </Container>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
}

export default DefaultCredentials;
