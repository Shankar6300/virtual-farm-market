import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  Typography,
  Box,
  TextField,
  Button,
  Container,
  Grid,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { AddCircle } from "@mui/icons-material";
import { useEffect } from "react";
import {
  GET_CITY_LIST,
  GET_PROVINCE_LIST,
} from "../../Redux/Reducers/authReducer";
import { useNavigate } from "react-router-dom";

import {
  CLEAR_MESSAGE_ADDRESS,
  GET_ADD_NEW_ADDRESS,
  GET_EDIT_ADDRESS,
} from "../../Redux/Reducers/addressReducer";
import { toast } from "react-toastify";
import EditIcon from "@mui/icons-material/Edit";
import { green } from "@mui/material/colors";

const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .typeError("Full name must be a string")
    .test("not-number", "Full name cannot be a number", (value) => isNaN(value))
    .required("Full name must be required"),
  phoneNumber: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
  streetNumber: Yup.string().required("Street Number is required"),
  homeAddress: Yup.string().required("Street Name is required"),
  city: Yup.string().required("City is required"),
  province: Yup.string().required("Province is required"),
  postalCode: Yup.string()
    .matches(/^(?:[a-zA-Z]\d[a-zA-Z] ?\d[a-zA-Z]\d|\d{6})$/, "Invalid Postal Code/Pincode format")
    .required("Postal code is required"),
});

function UserAddressForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const address = useSelector((state) => state.address);
  const { addressObj } = address;

  const formikRef = React.useRef(null);
  const [leafletLoaded, setLeafletLoaded] = React.useState(false);
  const [mapInstance, setMapInstance] = React.useState(null);
  const [markerInstance, setMarkerInstance] = React.useState(null);
  const [locating, setLocating] = React.useState(false);

  useEffect(() => {
    dispatch({ type: GET_CITY_LIST });
    dispatch({ type: GET_PROVINCE_LIST });

    // Load leaflet CSS
    let link = document.getElementById("leaflet-css");
    if (!link) {
      link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    
    // Load leaflet JS
    let script = document.getElementById("leaflet-js");
    if (!script) {
      script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }

    return () => {
      // Clean up map on unmount
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (leafletLoaded && window.L && !mapInstance) {
      // Default to Thorold, Alberta: 43.0800, -79.1989
      const defaultLat = 43.0800;
      const defaultLng = -79.1989;
      
      const map = window.L.map("leaflet-map").setView([defaultLat, defaultLng], 13);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
      }).addTo(map);

      // Fix marker icon loading path
      const DefaultIcon = window.L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      window.L.Marker.prototype.options.icon = DefaultIcon;

      const marker = window.L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
      
      setMapInstance(map);
      setMarkerInstance(marker);

      // Setup dragend and click listeners
      marker.on("dragend", async (e) => {
        const pos = e.target.getLatLng();
        updateFormValues(pos.lat, pos.lng);
      });

      map.on("click", async (e) => {
        const pos = e.latlng;
        marker.setLatLng(pos);
        updateFormValues(pos.lat, pos.lng);
      });
    }
  }, [leafletLoaded, mapInstance]);

  const reverseGeocode = async (lat, lng, setFieldValue) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        
        // 1. Door number
        const doorNo = addr.house_number || "Door No 1";
        setFieldValue("streetNumber", doorNo);

        // 2. Street name
        const streetName = addr.road || addr.suburb || addr.neighbourhood || "Main Street";
        setFieldValue("homeAddress", streetName);

        // 3. City
        let finalCity = "";
        const cityVal = addr.city || addr.town || addr.village || addr.municipality || "";
        if (cityVal && auth.cityList) {
          const matched = auth.cityList.find(c => c.name.toLowerCase().includes(cityVal.toLowerCase()) || cityVal.toLowerCase().includes(c.name.toLowerCase()));
          if (matched) finalCity = matched.name;
        }
        setFieldValue("city", finalCity || cityVal || "Hyderabad");

        // 4. Province (State)
        let finalProvince = "";
        const provinceVal = addr.state || addr.region || "";
        if (provinceVal && auth.provinceList) {
          const matched = auth.provinceList.find(p => p.name.toLowerCase().includes(provinceVal.toLowerCase()) || provinceVal.toLowerCase().includes(p.name.toLowerCase()));
          if (matched) finalProvince = matched.name;
        }
        setFieldValue("province", finalProvince || provinceVal || "Telangana");

        // 5. Postal code / Pincode
        const postalCodeVal = addr.postcode || "500001";
        setFieldValue("postalCode", postalCodeVal.toUpperCase().replace(/\s/g, ""));
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  const updateFormValues = (lat, lng) => {
    if (formikRef.current) {
      reverseGeocode(lat, lng, formikRef.current.setFieldValue);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstance && markerInstance) {
          mapInstance.setView([latitude, longitude], 15);
          markerInstance.setLatLng([latitude, longitude]);
        }
        updateFormValues(latitude, longitude);
        setLocating(false);
        toast.success("Location detected & address filled!");
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Unable to retrieve your current location");
        setLocating(false);
      }
    );
  };

  useEffect(() => {}, [navigate, dispatch]);

  useEffect(() => {
    if (address.message) {
      toast.success(address.message);
      dispatch({ type: CLEAR_MESSAGE_ADDRESS });
      navigate("/user/defaultcreds");
    }
  }, [address.message]);

  const handleSubmit = (values) => {
    if (Object.entries(address.addressObj).length === 0) {
      const finalValues = {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        address: values.streetNumber,
        address2: values.homeAddress,
        province: values.province,
        city: values.city,
        postalCode: values.postalCode,
      };
      console.log(finalValues);
      dispatch({ type: GET_ADD_NEW_ADDRESS, payload: finalValues });
    } else {
      const finalValues = {
        _id: addressObj._id,
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        address: values.streetNumber,
        address2: values.homeAddress,
        province: values.province,
        city: values.city,
        postalCode: values.postalCode,
      };
      console.log(finalValues);
      dispatch({ type: GET_EDIT_ADDRESS, payload: finalValues });
    }
  };

  const handleCancle = () => {
    navigate("/user/defaultcreds");
  };

  return (
    <>
      <Container maxWidth="md">
        <Grid container direction="row">
          <Grid item xs={12}>
            {address.loading ? null : (
              <Container maxWidth="md" sx={{ mt: 4 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    {Object.entries(addressObj).length === 0
                      ? `Add Address`
                      : `Edit Address`}
                  </Typography>

                  {address.error && (
                    <Alert severity="error">{address.error}</Alert>
                  )}

                  <Formik
                    innerRef={formikRef}
                    initialValues={
                      Object.entries(address.addressObj).length === 0
                        ? {
                            fullName: "",
                            phoneNumber: "",
                            streetNumber: "",
                            homeAddress: "",
                            province: "",
                            city: "",
                            postalCode: "",
                          }
                        : {
                            fullName: addressObj.fullName,
                            phoneNumber: addressObj.phoneNumber,
                            streetNumber: addressObj.address,
                            homeAddress: addressObj.address2,
                            province: addressObj.province,
                            city: addressObj.city,
                            postalCode: addressObj.postalCode,
                          }
                    }
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                  >
                    {(formik) => (
                      <Form autoComplete="off">
                        <Grid container spacing={2}>
                          {/* Map & Geolocation UI */}
                          <Grid item xs={12}>
                            <Box sx={{ p: 2, border: "1px solid #ddd", borderRadius: 2, bgcolor: "#fdfdfd", mb: 3 }}>
                              <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                  Choose Location on Map
                                </Typography>
                                <Button
                                  variant="contained"
                                  onClick={handleUseCurrentLocation}
                                  disabled={locating}
                                  size="small"
                                  sx={{ bgcolor: green["A700"], "&:hover": { bgcolor: green["A400"] } }}
                                >
                                  {locating ? "Locating..." : "Use Current Location"}
                                </Button>
                              </Box>
                              <div
                                id="leaflet-map"
                                style={{
                                  height: "280px",
                                  width: "100%",
                                  borderRadius: "8px",
                                  border: "1px solid #ccc",
                                  marginBottom: "10px",
                                  zIndex: 1
                                }}
                              />
                              <Typography variant="caption" color="textSecondary" display="block">
                                * Drag the blue pin or click anywhere on the map to pin your location and autofill address details.
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12}>
                            <Grid container spacing={1}>
                              <Grid item xs={12} sm={8}>
                                <Typography variant="h5" sx={{ ml: 1, mt: 2 }}>
                                  Full Name:
                                </Typography>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  id="fullName"
                                  name="fullName"
                                  autoComplete="fullName"
                                />
                                <ErrorMessage
                                  name="fullName"
                                  id="fullName"
                                  component="div"
                                  className="error text-danger"
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <Typography
                                  variant="h5"
                                  sx={{ mt: { xs: 3, sm: 2 } }}
                                >
                                  Phone Number:
                                </Typography>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  id="phoneNumber"
                                  name="phoneNumber"
                                  autoComplete="phoneNumber"
                                  placeholder="1234567890"
                                />
                                <ErrorMessage
                                  name="phoneNumber"
                                  id="phoneNumber"
                                  component="div"
                                  className="error text-danger"
                                />
                              </Grid>
                            </Grid>
                          </Grid>

                          <Grid item xs={12}>
                            <Typography variant="h5" sx={{ ml: 1, mt: 2 }}>
                              Address:
                            </Typography>
                            <Field
                              as={TextField}
                              fullWidth
                              id="streetNumber"
                              name="streetNumber"
                              autoComplete="streetNumber"
                              placeholder="Street Number"
                            />
                            {formik.touched.streetNumber &&
                              Boolean(formik.errors.streetNumber) && (
                                <Box sx={{ mb: 2 }}>
                                  <ErrorMessage
                                    name="streetNumber"
                                    id="streetNumber"
                                    component="div"
                                    className="error text-danger"
                                  />
                                </Box>
                              )}
                            <Field
                              as={TextField}
                              fullWidth
                              id="homeAddress"
                              name="homeAddress"
                              autoComplete="homeAddress"
                              placeholder="Apt, Suite, Unit, Building"
                            />
                            <ErrorMessage
                              name="homeAddress"
                              id="homeAddress"
                              component="div"
                              className="error text-danger"
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Typography variant="h5" sx={{ ml: 1, mt: 2 }}>
                              City:
                            </Typography>

                            <Field
                              as={Select}
                              fullWidth
                              id="city"
                              name="city"
                              autoComplete="city"
                            >
                              {auth.cityList &&
                                auth.cityList.map((item, index) => (
                                  <MenuItem value={item.name} key={item._id}>
                                    {item.name}
                                  </MenuItem>
                                ))}
                              {formik.values.city && auth.cityList && !auth.cityList.some(c => c.name.toLowerCase() === formik.values.city.toLowerCase()) && (
                                <MenuItem value={formik.values.city} key="custom-city">
                                  {formik.values.city}
                                </MenuItem>
                              )}
                            </Field>
                            <ErrorMessage
                              name="city"
                              id="city"
                              component="div"
                              className="error text-danger"
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Grid container spacing={1}>
                              <Grid item xs={12} sm={8}>
                                <Typography variant="h5" sx={{ ml: 1, mt: 2 }}>
                                  Province/Territory:
                                </Typography>
                                <Field
                                  as={Select}
                                  fullWidth
                                  id="province"
                                  name="province"
                                  autoComplete="province"
                                >
                                  {auth.provinceList &&
                                    auth.provinceList.map((item, index) => (
                                      <MenuItem
                                        value={item.name}
                                        key={item._id}
                                      >
                                        {item.name}
                                      </MenuItem>
                                    ))}
                                  {formik.values.province && auth.provinceList && !auth.provinceList.some(p => p.name.toLowerCase() === formik.values.province.toLowerCase()) && (
                                    <MenuItem value={formik.values.province} key="custom-province">
                                      {formik.values.province}
                                    </MenuItem>
                                  )}
                                </Field>
                                <ErrorMessage
                                  name="province"
                                  id="province"
                                  component="div"
                                  className="error text-danger"
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <Typography
                                  variant="h5"
                                  sx={{ mt: { xs: 3, sm: 2 } }}
                                >
                                  Postal Code:
                                </Typography>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  id="postalCode"
                                  name="postalCode"
                                  autoComplete="postalCode"
                                  placeholder="V2V 2V2 or V2V2V2"
                                />
                                <ErrorMessage
                                  name="postalCode"
                                  id="postalCode"
                                  component="div"
                                  className="error text-danger"
                                />
                              </Grid>
                            </Grid>
                          </Grid>

                          <Grid
                            item
                            xs={12}
                            sx={{ mt: 3 }}
                          >
                            <Button
                              variant="outlined"
                              onClick={() => handleCancle()}
                              sx={{ mx: 2 }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="contained"
                              sx={{
                                bgcolor: green["A700"],
                                "&:hover": { bgcolor: green["A400"] },
                              }}
                              type="submit"
                              startIcon={
                                Object.entries(address.addressObj).length ===
                                0 ? (
                                  <AddCircle />
                                ) : (
                                  <EditIcon />
                                )
                              }
                            >
                              {Object.entries(address.addressObj).length === 0
                                ? `Add Address`
                                : `Edit Address`}
                            </Button>
                          </Grid>
                        </Grid>
                      </Form>
                    )}
                  </Formik>
                </Box>
              </Container>
            )}
          </Grid>
        </Grid>{" "}
      </Container>
    </>
  );
}

export default UserAddressForm;
