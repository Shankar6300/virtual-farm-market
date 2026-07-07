import React, { useEffect, useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import "./PaymentGatewayCheckoutFormCSS.css";
import { useDispatch, useSelector } from "react-redux";
import {
  CLEAR_MESSAGE_STRIPEPAYMENT,
  GET_ADD_CARD_STRIPEPAYMENT,
  GET_ALL_CARD_STRIPEPAYMENT,
  GET_DELETE_CARD_STRIPEPAYMENT,
  GET_MAKE_DEFAULT_STRIPEPAYMENT,
} from "../../Redux/Reducers/stripePaymentReducer";
import {
  Alert,
  Box,
  Button,
  Grid,
  LinearProgress,
  Tooltip,
  Container,
  Card,
  CardContent,
  Typography,
  Paper,
  Stack,
  Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Visa from "../../Assets/card/visa.png";
import Discover from "../../Assets/card/discover.png";
import JCB from "../../Assets/card/jcb.png";
import MasterCard from "../../Assets/card/maestro.png";
import UnionPay from "../../Assets/card/unionpay.png";
import DinersClub from "../../Assets/card/dinersclub.png";
import AmericanExpress from "../../Assets/card/americanexpress.png";

const cardImages = {
  Visa,
  Discover,
  JCB,
  MasterCard,
  UnionPay,
  "Diners Club": DinersClub,
  "American Express": AmericanExpress,
};

function PaymentGatewayCheckoutForm({ handleCheckouts }) {
  const [addNewCard, setAddNewCard] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const stripe = useStripe();
  const elements = useElements();
  const stripePayment = useSelector((state) => state.stripePayment);

  useEffect(() => {
    dispatch({ type: GET_ALL_CARD_STRIPEPAYMENT });
  }, []);

  useEffect(() => {
    if (stripePayment.message) {
      toast.success(stripePayment.message);
      dispatch({ type: CLEAR_MESSAGE_STRIPEPAYMENT });
      dispatch({ type: GET_ALL_CARD_STRIPEPAYMENT });
    } else if (stripePayment.error) {
      toast.error(stripePayment.error);
    }
  }, [stripePayment.message, stripePayment.error]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    const card = elements.getElement(CardElement);
    const { token, error } = await stripe.createToken(card);
    if (error) {
      setError(error.message);
    } else {
      dispatch({
        type: GET_ADD_CARD_STRIPEPAYMENT,
        payload: { stripeToken: token.id },
      });
      setAddNewCard(false);
      setError("");
    }
  };

  const handleMakeDefaultCard = (id) => {
    dispatch({
      type: GET_MAKE_DEFAULT_STRIPEPAYMENT,
      payload: { cardId: id },
    });
    // Give state some time to update, then reload
    setTimeout(() => {
      dispatch({ type: GET_ALL_CARD_STRIPEPAYMENT });
    }, 100);
  };

  function handleDeleteCard(id) {
    dispatch({
      type: GET_DELETE_CARD_STRIPEPAYMENT,
      payload: { cardId: id },
    });
    setTimeout(() => {
      dispatch({ type: GET_ALL_CARD_STRIPEPAYMENT });
    }, 100);
  }

  function handleCheckout() {
    navigate("/user/defaultcreds");
    if (handleCheckouts) handleCheckouts();
  }

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      {stripePayment.loading && <LinearProgress color="success" sx={{ mb: 2 }} />}
      <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold", color: "#333" }}>
            Stripe Payment Methods
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={addNewCard ? <RemoveIcon /> : <AddIcon />}
              onClick={() => setAddNewCard(!addNewCard)}
            >
              {addNewCard ? "Cancel" : "Add Card"}
            </Button>
            <Button
              variant="contained"
              onClick={handleCheckout}
              sx={{ bgcolor: "#e65100", "&:hover": { bgcolor: "#b53d00" } }}
            >
              Checkout
            </Button>
          </Box>

          {addNewCard && (
            <Box sx={{ p: 3, border: "2px solid #a5d6a7", borderRadius: 2, mb: 3, bgcolor: "#fafafa" }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Add Stripe Card Details:
              </Typography>
              <form onSubmit={handleSubmit}>
                <Box sx={{ py: 2.5, px: 2, border: "1px solid #ccc", borderRadius: 1.5, bgcolor: "#fff", mb: 2 }}>
                  <CardElement onChange={(e) => setError(e.error ? e.error.message : "")} />
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box sx={{ display: "flex", justifyContent: "end" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    disabled={!stripe || stripePayment.loading}
                  >
                    {stripePayment.loading ? "Adding..." : "Register Card"}
                  </Button>
                </Box>
              </form>
            </Box>
          )}

          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", mt: 2 }}>
            Saved Stripe Cards:
          </Typography>

          <Stack spacing={2}>
            {stripePayment.cardList && stripePayment.cardList.length > 0 ? (
              stripePayment.cardList.map((card) => (
                <Paper
                  elevation={3}
                  sx={{
                    p: 2.5,
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    position: "relative",
                  }}
                  key={card.id}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <img
                        style={{ height: "30px", width: "auto" }}
                        src={cardImages[card.brand] || cardImages["Visa"]}
                        alt={card.brand}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: "bold" }}>
                          **** **** **** {card.last4}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Expires: {card.exp_month}/{card.exp_year}
                        </Typography>
                      </Box>
                    </Box>
                    {card.isDefaultCard && (
                      <Tooltip title="Default Card">
                        <BookmarkIcon sx={{ color: "#2e7d32" }} />
                      </Tooltip>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "end", gap: 1 }}>
                    {!card.isDefaultCard && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleMakeDefaultCard(card.id)}
                        startIcon={<BookmarkAddIcon />}
                      >
                        Make Default
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteCard(card.id)}
                      startIcon={<DeleteOutlineIcon />}
                    >
                      Delete
                    </Button>
                  </Box>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                No registered Stripe cards found. Add a card above to test Stripe transactions.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default PaymentGatewayCheckoutForm;
